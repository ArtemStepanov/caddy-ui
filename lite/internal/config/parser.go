package config

import (
	"encoding/json"
	"strings"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
	"github.com/google/uuid"
)

// ParseCaddyConfig converts a Caddy configuration to a list of storage routes
func ParseCaddyConfig(cfg *CaddyConfig) ([]*storage.Route, error) {
	var routes []*storage.Route

	if cfg.Apps == nil || cfg.Apps.HTTP == nil || cfg.Apps.HTTP.Servers == nil {
		return routes, nil
	}

	for _, server := range cfg.Apps.HTTP.Servers {
		for _, caddyRoute := range server.Routes {
			parsedRoute, err := parseRoute(caddyRoute)
			if err != nil {
				// Log error but continue? Or skip?
				// For now, we'll skip invalid routes but maybe we should still import them as "raw"
				// If we fail to parse, let's treat it as an unknown handler type
				parsedRoute = createRawRoute(caddyRoute)
			}
			routes = append(routes, parsedRoute)
		}
	}

	return routes, nil
}

func parseRoute(r Route) (*storage.Route, error) {
	// marshal raw route first
	rawJSON, err := json.Marshal(r)
	if err != nil {
		return nil, err
	}

	storageRoute := &storage.Route{
		ID:            uuid.New().String(),
		Enabled:       true,
		RawCaddyRoute: rawJSON,
	}

	// 1. Extract Matchers
	if len(r.Match) > 0 {
		// We only look at the first match block for simplicity,
		// as our builder only creates one.
		match := r.Match[0]

		if len(match.Host) > 0 {
			storageRoute.Domain = strings.Join(match.Host, ", ")
		} else {
			// No host matcher -> Global route
			storageRoute.Domain = "*"
		}

		if len(match.Path) > 0 {
			storageRoute.Path = match.Path[0] // We only support single path in UI model for now
		}
	} else {
		// No matchers -> Global route matching everything
		storageRoute.Domain = "*"
	}

	// 2. Extract Handlers
	// We look for known handlers: reverse_proxy, file_server, static_response (redir)
	// We also look for headers and encode

	var mainHandlerFound bool

	for _, h := range r.Handle {
		handlerType, ok := h["handler"].(string)
		if !ok {
			continue
		}

		switch handlerType {
		case "reverse_proxy":
			if mainHandlerFound {
				continue
			} // Only one main handler supported

			cfg, err := parseReverseProxy(h)
			if err == nil {
				storageRoute.HandlerType = "reverse_proxy"
				storageRoute.Config, _ = json.Marshal(cfg)
				mainHandlerFound = true
			}

		case "file_server":
			if mainHandlerFound {
				continue
			}

			cfg, err := parseFileServer(h)
			if err == nil {
				storageRoute.HandlerType = "file_server"
				storageRoute.Config, _ = json.Marshal(cfg)
				mainHandlerFound = true
			}

		case "static_response":
			// Check if it's a redirect (has Location header)
			if headers, ok := h["headers"].(map[string]any); ok {
				if _, hasLoc := headers["Location"]; hasLoc {
					if mainHandlerFound {
						continue
					}

					cfg, err := parseRedirect(h)
					if err == nil {
						storageRoute.HandlerType = "redir"
						storageRoute.Config, _ = json.Marshal(cfg)
						mainHandlerFound = true
					}
				}
			}

		case "headers":
			// Parse headers
			cfg, err := parseHeaders(h)
			if err == nil {
				storageRoute.Headers = cfg
			}

		case "encode":
			// We just ignore encode handler as it's global setting in our model usually,
			// or implied. But if we want to support per-route encode, we'd need to add it to model.
			// For now, we ignore it, but it's preserved in RawCaddyRoute.
		}
	}

	if !mainHandlerFound {
		// If we couldn't parse a known main handler, mark as unknown
		// The original JSON is preserved in RawCaddyRoute, so it will be synced back as is.
		storageRoute.HandlerType = "unknown"
		storageRoute.Config = json.RawMessage("{}")
	}

	return storageRoute, nil
}

func createRawRoute(r Route) *storage.Route {
	rawJSON, _ := json.Marshal(r)
	return &storage.Route{
		ID:            uuid.New().String(),
		Domain:        "UNKNOWN",
		HandlerType:   "unknown",
		Enabled:       true,
		RawCaddyRoute: rawJSON,
		Config:        json.RawMessage("{}"),
	}
}

func parseReverseProxy(h Handler) (*storage.ReverseProxyConfig, error) {
	cfg := &storage.ReverseProxyConfig{}

	// Upstreams
	if upstreams, ok := h["upstreams"].([]any); ok {
		for _, u := range upstreams {
			if uMap, ok := u.(map[string]any); ok {
				if dial, ok := uMap["dial"].(string); ok {
					cfg.Upstreams = append(cfg.Upstreams, dial)
				}
			}
		}
	}

	// Headers
	if headers, ok := h["headers"].(map[string]any); ok {
		if req, ok := headers["request"].(map[string]any); ok {
			if set, ok := req["set"].(map[string]any); ok {
				cfg.Headers = make(map[string]string)
				for k, v := range set {
					// v is usually []any or []string
					if vSlice, ok := v.([]any); ok && len(vSlice) > 0 {
						if vStr, ok := vSlice[0].(string); ok {
							cfg.Headers[k] = vStr
						}
					}
				}
			}
		}
	}

	// Load balancing
	if lb, ok := h["load_balancing"].(map[string]any); ok {
		if sel, ok := lb["selection_policy"].(map[string]any); ok {
			if policy, ok := sel["policy"].(string); ok {
				cfg.LoadBalancing = policy
			}
		}
	}

	return cfg, nil
}

func parseFileServer(h Handler) (*storage.FileServerConfig, error) {
	cfg := &storage.FileServerConfig{}

	if root, ok := h["root"].(string); ok {
		cfg.Root = root
	}

	if _, ok := h["browse"]; ok {
		cfg.Browse = true
	}

	if index, ok := h["index_names"].([]any); ok {
		for _, i := range index {
			if s, ok := i.(string); ok {
				cfg.Index = append(cfg.Index, s)
			}
		}
	}

	// Precompressed
	if _, ok := h["precompressed"]; ok {
		cfg.Precompressed = true
	}

	return cfg, nil
}

func parseRedirect(h Handler) (*storage.RedirectConfig, error) {
	cfg := &storage.RedirectConfig{}

	if codeStr, ok := h["status_code"].(float64); ok { // json unmarshals numbers to float64
		cfg.Code = int(codeStr)
	}

	if headers, ok := h["headers"].(map[string]any); ok {
		if loc, ok := headers["Location"].([]any); ok && len(loc) > 0 {
			if s, ok := loc[0].(string); ok {
				cfg.To = s
			}
		}
	}

	return cfg, nil
}

func parseHeaders(h Handler) (*storage.HeaderConfig, error) {
	cfg := &storage.HeaderConfig{}

	if resp, ok := h["response"].(map[string]any); ok {
		// Set
		if set, ok := resp["set"].(map[string]any); ok {
			cfg.Set = make(map[string]string)
			for k, v := range set {
				if vSlice, ok := v.([]any); ok && len(vSlice) > 0 {
					if vStr, ok := vSlice[0].(string); ok {
						cfg.Set[k] = vStr
					}
				}
			}
		}

		// Add
		if add, ok := resp["add"].(map[string]any); ok {
			cfg.Add = make(map[string]string)
			for k, v := range add {
				if vSlice, ok := v.([]any); ok && len(vSlice) > 0 {
					if vStr, ok := vSlice[0].(string); ok {
						cfg.Add[k] = vStr
					}
				}
			}
		}

		// Delete
		if del, ok := resp["delete"].([]any); ok {
			for _, d := range del {
				if s, ok := d.(string); ok {
					cfg.Delete = append(cfg.Delete, s)
				}
			}
		}
	}

	return cfg, nil
}
