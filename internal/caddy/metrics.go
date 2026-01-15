package caddy

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// MetricsData contains parsed Prometheus metrics from Caddy
type MetricsData struct {
	// Per-upstream health status from caddy_reverse_proxy_upstreams_healthy
	Upstreams map[string]UpstreamMetrics `json:"upstreams"`
	// Per-handler/server statistics
	Handlers map[string]HandlerMetrics `json:"handlers"`
	// Global metrics
	TotalRequestsInFlight int64     `json:"total_requests_in_flight"`
	Timestamp             time.Time `json:"timestamp"`
}

// UpstreamMetrics contains metrics for a single upstream
type UpstreamMetrics struct {
	Address string `json:"address"`
	Healthy bool   `json:"healthy"`
}

// HandlerMetrics contains metrics for an HTTP handler
type HandlerMetrics struct {
	Server           string  `json:"server"`
	Handler          string  `json:"handler"`
	RequestsTotal    int64   `json:"requests_total"`
	ErrorsTotal      int64   `json:"errors_total"`
	RequestsInFlight int64   `json:"requests_in_flight"`
	// Duration histogram data
	DurationSum   float64 `json:"duration_sum_seconds"`
	DurationCount int64   `json:"duration_count"`
	// Calculated average
	AvgDurationMs float64 `json:"avg_duration_ms"`
	// Histogram buckets for percentile calculation
	DurationBuckets map[float64]int64 `json:"duration_buckets,omitempty"`
}

// GetMetrics fetches and parses Prometheus metrics from a Caddy instance
func (c *Client) GetMetrics() (*MetricsData, error) {
	resp, err := c.doRequest("GET", "/metrics", nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch metrics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get metrics: status %d, body: %s", resp.StatusCode, string(body))
	}

	return parsePrometheusMetrics(resp.Body)
}

// parsePrometheusMetrics parses Prometheus exposition format into MetricsData
func parsePrometheusMetrics(reader io.Reader) (*MetricsData, error) {
	data := &MetricsData{
		Upstreams: make(map[string]UpstreamMetrics),
		Handlers:  make(map[string]HandlerMetrics),
		Timestamp: time.Now(),
	}

	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()

		// Skip comments and empty lines
		if strings.HasPrefix(line, "#") || len(strings.TrimSpace(line)) == 0 {
			continue
		}

		// Parse different metric types
		if strings.HasPrefix(line, "caddy_reverse_proxy_upstreams_healthy") {
			parseUpstreamHealthy(line, data)
		} else if strings.HasPrefix(line, "caddy_http_requests_in_flight") {
			parseRequestsInFlight(line, data)
		} else if strings.HasPrefix(line, "caddy_http_requests_total") {
			parseRequestsTotal(line, data)
		} else if strings.HasPrefix(line, "caddy_http_request_errors_total") {
			parseErrorsTotal(line, data)
		} else if strings.HasPrefix(line, "caddy_http_request_duration_seconds") {
			parseDurationMetric(line, data)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading metrics: %w", err)
	}

	// Calculate average durations
	for key, handler := range data.Handlers {
		if handler.DurationCount > 0 {
			handler.AvgDurationMs = (handler.DurationSum / float64(handler.DurationCount)) * 1000
			data.Handlers[key] = handler
		}
	}

	return data, nil
}

// parseLabels extracts labels from a Prometheus metric line
// Example: metric_name{label1="value1",label2="value2"} 123
func parseLabels(line string) (map[string]string, float64) {
	labels := make(map[string]string)
	var value float64

	// Find the labels section
	labelStart := strings.Index(line, "{")
	labelEnd := strings.Index(line, "}")

	if labelStart != -1 && labelEnd != -1 {
		labelStr := line[labelStart+1 : labelEnd]
		// Parse each label
		parts := splitLabels(labelStr)
		for _, part := range parts {
			kv := strings.SplitN(part, "=", 2)
			if len(kv) == 2 {
				key := strings.TrimSpace(kv[0])
				val := strings.Trim(kv[1], "\"")
				labels[key] = val
			}
		}
		// Parse the value after the closing brace
		valueStr := strings.TrimSpace(line[labelEnd+1:])
		value, _ = strconv.ParseFloat(valueStr, 64)
	} else {
		// No labels, just metric_name value
		parts := strings.Fields(line)
		if len(parts) >= 2 {
			value, _ = strconv.ParseFloat(parts[1], 64)
		}
	}

	return labels, value
}

// splitLabels handles comma separation within label values
func splitLabels(s string) []string {
	var result []string
	var current strings.Builder
	inQuotes := false

	for _, r := range s {
		switch r {
		case '"':
			inQuotes = !inQuotes
			current.WriteRune(r)
		case ',':
			if inQuotes {
				current.WriteRune(r)
			} else {
				result = append(result, current.String())
				current.Reset()
			}
		default:
			current.WriteRune(r)
		}
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}
	return result
}

func parseUpstreamHealthy(line string, data *MetricsData) {
	labels, value := parseLabels(line)
	upstream := labels["upstream"]
	if upstream != "" {
		data.Upstreams[upstream] = UpstreamMetrics{
			Address: upstream,
			Healthy: value == 1,
		}
	}
}

func parseRequestsInFlight(line string, data *MetricsData) {
	labels, value := parseLabels(line)
	server := labels["server"]
	handler := labels["handler"]

	// Accumulate global total
	data.TotalRequestsInFlight += int64(value)

	// Store per-handler
	if server != "" || handler != "" {
		key := handlerKey(server, handler)
		h := data.Handlers[key]
		h.Server = server
		h.Handler = handler
		h.RequestsInFlight = int64(value)
		data.Handlers[key] = h
	}
}

func parseRequestsTotal(line string, data *MetricsData) {
	labels, value := parseLabels(line)
	server := labels["server"]
	handler := labels["handler"]

	if server != "" || handler != "" {
		key := handlerKey(server, handler)
		h := data.Handlers[key]
		h.Server = server
		h.Handler = handler
		h.RequestsTotal += int64(value)
		data.Handlers[key] = h
	}
}

func parseErrorsTotal(line string, data *MetricsData) {
	labels, value := parseLabels(line)
	server := labels["server"]
	handler := labels["handler"]

	if server != "" || handler != "" {
		key := handlerKey(server, handler)
		h := data.Handlers[key]
		h.Server = server
		h.Handler = handler
		h.ErrorsTotal += int64(value)
		data.Handlers[key] = h
	}
}

func parseDurationMetric(line string, data *MetricsData) {
	labels, value := parseLabels(line)
	server := labels["server"]
	handler := labels["handler"]

	if server == "" && handler == "" {
		return
	}

	key := handlerKey(server, handler)
	h := data.Handlers[key]
	h.Server = server
	h.Handler = handler

	if strings.Contains(line, "_sum") {
		h.DurationSum = value
	} else if strings.Contains(line, "_count") {
		h.DurationCount = int64(value)
	} else if strings.Contains(line, "_bucket") {
		// Parse histogram bucket
		le := labels["le"]
		if le != "" && le != "+Inf" {
			bucket, _ := strconv.ParseFloat(le, 64)
			if h.DurationBuckets == nil {
				h.DurationBuckets = make(map[float64]int64)
			}
			h.DurationBuckets[bucket] = int64(value)
		}
	}

	data.Handlers[key] = h
}

func handlerKey(server, handler string) string {
	if server != "" && handler != "" {
		return server + ":" + handler
	}
	if server != "" {
		return server
	}
	return handler
}
