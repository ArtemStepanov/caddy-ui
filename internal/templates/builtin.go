package templates

import (
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
)

// GetBuiltinTemplates returns the built-in configuration templates
func GetBuiltinTemplates() []*storage.ConfigTemplate {
	return []*storage.ConfigTemplate{
		{
			ID:          "reverse-proxy-basic",
			Name:        "Basic Reverse Proxy",
			Description: "Simple reverse proxy configuration for internal services",
			Category:    "reverse-proxy",
			Template: map[string]any{
				"apps": map[string]any{
					"http": map[string]any{
						"servers": map[string]any{
							"{{.server_name}}": map[string]any{
								"listen": []string{":{{.port}}"},
								"routes": []any{
									map[string]any{
										"match": []map[string]any{
											{
												"host": []string{"{{.domain}}"},
											},
										},
										"handle": []map[string]any{
											{
												"handler": "reverse_proxy",
												"upstreams": []map[string]any{
													{
														"dial": "{{.upstream}}",
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			Variables: []storage.TemplateVariable{
				{
					Name:         "server_name",
					Type:         "string",
					Required:     true,
					DefaultValue: "srv0",
					Description:  "Server name identifier",
				},
				{
					Name:         "port",
					Type:         "number",
					Required:     true,
					DefaultValue: 443,
					Description:  "Port to listen on",
				},
				{
					Name:        "domain",
					Type:        "string",
					Required:    true,
					Description: "Domain name to match",
				},
				{
					Name:        "upstream",
					Type:        "string",
					Required:    true,
					Description: "Upstream server address (e.g., localhost:8080)",
				},
			},
		},
		{
			ID:          "static-file-server",
			Name:        "Static File Server",
			Description: "Serve static files with automatic HTTPS",
			Category:    "file-server",
			Template: map[string]any{
				"apps": map[string]any{
					"http": map[string]any{
						"servers": map[string]any{
							"{{.server_name}}": map[string]any{
								"listen": []string{":{{.port}}"},
								"routes": []any{
									map[string]any{
										"match": []map[string]any{
											{
												"host": []string{"{{.domain}}"},
											},
										},
										"handle": []map[string]any{
											{
												"handler": "file_server",
												"root":    "{{.root_path}}",
												"browse":  "{{.enable_browse}}",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			Variables: []storage.TemplateVariable{
				{
					Name:         "server_name",
					Type:         "string",
					Required:     true,
					DefaultValue: "srv0",
					Description:  "Server name identifier",
				},
				{
					Name:         "port",
					Type:         "number",
					Required:     true,
					DefaultValue: 443,
					Description:  "Port to listen on",
				},
				{
					Name:        "domain",
					Type:        "string",
					Required:    true,
					Description: "Domain name to serve",
				},
				{
					Name:        "root_path",
					Type:        "string",
					Required:    true,
					Description: "Root directory path for static files",
				},
				{
					Name:         "enable_browse",
					Type:         "boolean",
					Required:     false,
					DefaultValue: false,
					Description:  "Enable directory browsing",
				},
			},
		},
		{
			ID:          "websocket-proxy",
			Name:        "WebSocket Proxy",
			Description: "Reverse proxy with WebSocket support",
			Category:    "reverse-proxy",
			Template: map[string]any{
				"apps": map[string]any{
					"http": map[string]any{
						"servers": map[string]any{
							"{{.server_name}}": map[string]any{
								"listen": []string{":{{.port}}"},
								"routes": []any{
									map[string]any{
										"match": []map[string]any{
											{
												"host": []string{"{{.domain}}"},
											},
										},
										"handle": []map[string]any{
											{
												"handler": "reverse_proxy",
												"upstreams": []map[string]any{
													{
														"dial": "{{.upstream}}",
													},
												},
												"headers": map[string]any{
													"request": map[string]any{
														"set": map[string][]string{
															"Connection": {"Upgrade"},
															"Upgrade":    {"websocket"},
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			Variables: []storage.TemplateVariable{
				{
					Name:         "server_name",
					Type:         "string",
					Required:     true,
					DefaultValue: "srv0",
					Description:  "Server name identifier",
				},
				{
					Name:         "port",
					Type:         "number",
					Required:     true,
					DefaultValue: 443,
					Description:  "Port to listen on",
				},
				{
					Name:        "domain",
					Type:        "string",
					Required:    true,
					Description: "Domain name to match",
				},
				{
					Name:        "upstream",
					Type:        "string",
					Required:    true,
					Description: "WebSocket upstream server address",
				},
			},
		},
		{
			ID:          "load-balancer",
			Name:        "Load Balancer",
			Description: "Load balancer with health checks",
			Category:    "load-balancer",
			Template: map[string]any{
				"apps": map[string]any{
					"http": map[string]any{
						"servers": map[string]any{
							"{{.server_name}}": map[string]any{
								"listen": []string{":{{.port}}"},
								"routes": []any{
									map[string]any{
										"match": []map[string]any{
											{
												"host": []string{"{{.domain}}"},
											},
										},
										"handle": []map[string]any{
											{
												"handler": "reverse_proxy",
												"load_balancing": map[string]any{
													"selection_policy": map[string]any{
														"policy": "{{.lb_policy}}",
													},
												},
												"health_checks": map[string]any{
													"active": map[string]any{
														"path":     "{{.health_path}}",
														"interval": "{{.health_interval}}",
														"timeout":  "{{.health_timeout}}",
													},
												},
												"upstreams": "{{.upstreams}}",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			Variables: []storage.TemplateVariable{
				{
					Name:         "server_name",
					Type:         "string",
					Required:     true,
					DefaultValue: "srv0",
					Description:  "Server name identifier",
				},
				{
					Name:         "port",
					Type:         "number",
					Required:     true,
					DefaultValue: 443,
					Description:  "Port to listen on",
				},
				{
					Name:        "domain",
					Type:        "string",
					Required:    true,
					Description: "Domain name to match",
				},
				{
					Name:         "lb_policy",
					Type:         "string",
					Required:     false,
					DefaultValue: "round_robin",
					Description:  "Load balancing policy (round_robin, least_conn, ip_hash)",
				},
				{
					Name:         "health_path",
					Type:         "string",
					Required:     false,
					DefaultValue: "/health",
					Description:  "Health check endpoint path",
				},
				{
					Name:         "health_interval",
					Type:         "string",
					Required:     false,
					DefaultValue: "30s",
					Description:  "Health check interval",
				},
				{
					Name:         "health_timeout",
					Type:         "string",
					Required:     false,
					DefaultValue: "5s",
					Description:  "Health check timeout",
				},
				{
					Name:        "upstreams",
					Type:        "array",
					Required:    true,
					Description: "Array of upstream servers",
				},
			},
		},
	}
}
