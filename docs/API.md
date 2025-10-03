# Caddy Orchestrator API Documentation

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": "Detailed error information"
  },
  "meta": {
    "timestamp": "2025-10-03T12:00:00Z",
    "request_id": "uuid"
  }
}
```

## Authentication

Currently, the API does not require authentication. This will be added in future versions.

## Rate Limiting

- **Limit**: 100 requests per second
- **Burst**: 200 requests
- **Response**: `429 Too Many Requests` when exceeded

## Endpoints

### Health Check

#### `GET /api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "service": "caddy-orchestrator"
}
```

---

## Instance Management

### List All Instances

#### `GET /api/instances`

Retrieve all Caddy instances.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Server",
      "admin_url": "http://caddy:2019",
      "auth_type": "none",
      "status": "online",
      "last_seen": "2025-10-03T12:00:00Z",
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-03T11:55:00Z"
    }
  ]
}
```

### Get Instance

#### `GET /api/instances/:id`

Retrieve a specific instance.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Server",
    "admin_url": "http://caddy:2019",
    "auth_type": "none",
    "credentials": {
      "token": "..."
    },
    "status": "online",
    "last_seen": "2025-10-03T12:00:00Z"
  }
}
```

### Create Instance

#### `POST /api/instances`

Create a new Caddy instance.

**Request:**
```json
{
  "name": "Production Server",
  "admin_url": "http://caddy:2019",
  "auth_type": "none",
  "credentials": {}
}
```

**Auth Types:**
- `none`: No authentication
- `bearer`: Bearer token authentication (requires `credentials.token`)
- `mtls`: Mutual TLS (requires `credentials.cert_file`, `credentials.key_file`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Server",
    "admin_url": "http://caddy:2019",
    "auth_type": "none",
    "status": "unknown"
  }
}
```

### Update Instance

#### `PUT /api/instances/:id`

Update an existing instance.

**Request:**
```json
{
  "name": "Updated Name",
  "admin_url": "http://new-url:2019",
  "auth_type": "bearer",
  "credentials": {
    "token": "new-token"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "admin_url": "http://new-url:2019",
    "status": "unknown"
  }
}
```

### Delete Instance

#### `DELETE /api/instances/:id`

Delete an instance.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Instance deleted successfully"
  }
}
```

### Test Connection

#### `POST /api/instances/:id/test-connection`

Test connection to a Caddy instance.

**Response:**
```json
{
  "success": true,
  "data": {
    "instance_id": "uuid",
    "healthy": true,
    "message": "Connection successful",
    "timestamp": "2025-10-03T12:00:00Z",
    "latency_ms": 45
  }
}
```

---

## Configuration Management

### Get Configuration

#### `GET /api/instances/:id/config[/:path]`

Retrieve configuration from a Caddy instance.

**Parameters:**
- `path` (optional): Specific configuration path (e.g., `apps/http/servers`)

**Headers:**
- `ETag`: Configuration version (returned in response)

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": {
      "http": {
        "servers": { ... }
      }
    }
  }
}
```

**Response Headers:**
- `ETag`: Configuration version hash

### Set Configuration

#### `POST /api/instances/:id/config[/:path]`

Set configuration on a Caddy instance.

**Headers:**
- `If-Match` (optional): ETag for optimistic locking

**Request:**
```json
{
  "apps": {
    "http": {
      "servers": { ... }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration updated successfully"
  }
}
```

**Error Response (ETag mismatch):**
```json
{
  "success": false,
  "error": {
    "code": "SET_CONFIG_FAILED",
    "message": "Failed to set configuration",
    "details": "ETag mismatch"
  }
}
```

### Patch Configuration

#### `PATCH /api/instances/:id/config[/:path]`

Patch (merge) configuration on a Caddy instance.

**Request:**
```json
{
  "apps": {
    "http": {
      "servers": {
        "new_server": { ... }
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration patched successfully"
  }
}
```

### Delete Configuration

#### `DELETE /api/instances/:id/config/:path`

Delete configuration at a specific path.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Configuration deleted successfully"
  }
}
```

---

## Utilities

### Adapt Caddyfile

#### `POST /api/instances/:id/adapt`

Convert Caddyfile format to JSON configuration.

**Request:**
```json
{
  "caddyfile": "example.com {\n  respond \"Hello World\"\n}",
  "adapter": "caddyfile"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": {
      "http": {
        "servers": { ... }
      }
    }
  }
}
```

### Get Upstreams

#### `GET /api/instances/:id/upstreams`

Get reverse proxy upstream information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "address": "localhost:8080",
      "healthy": true,
      "num_requests": 1234,
      "fails": 0
    }
  ]
}
```

### Get PKI CA

#### `GET /api/instances/:id/pki/ca/:ca_id`

Get PKI Certificate Authority information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "local",
    "name": "Caddy Local Authority",
    "root_certificate": "-----BEGIN CERTIFICATE-----\n...",
    "intermediate_certificate": "-----BEGIN CERTIFICATE-----\n..."
  }
}
```

---

## Template Management

### List Templates

#### `GET /api/templates`

List all configuration templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "reverse-proxy-basic",
      "name": "Basic Reverse Proxy",
      "description": "Simple reverse proxy configuration",
      "category": "reverse-proxy",
      "variables": [
        {
          "name": "domain",
          "type": "string",
          "required": true,
          "description": "Domain name to match"
        }
      ]
    }
  ]
}
```

### Get Template

#### `GET /api/templates/:id`

Get a specific template.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "reverse-proxy-basic",
    "name": "Basic Reverse Proxy",
    "description": "Simple reverse proxy configuration",
    "category": "reverse-proxy",
    "template": { ... },
    "variables": [ ... ]
  }
}
```

### Create Template

#### `POST /api/templates`

Create a custom template.

**Request:**
```json
{
  "name": "My Custom Template",
  "description": "Custom configuration",
  "category": "custom",
  "template": { ... },
  "variables": [
    {
      "name": "port",
      "type": "number",
      "required": true,
      "default_value": 8080,
      "description": "Port to listen on"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Custom Template",
    "category": "custom"
  }
}
```

### Generate Configuration

#### `POST /api/templates/:id/generate`

Generate configuration from a template.

**Request:**
```json
{
  "variables": {
    "domain": "example.com",
    "upstream": "localhost:8080",
    "port": 443
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": {
      "http": {
        "servers": { ... }
      }
    }
  }
}
```

---

## Bulk Operations

### Bulk Config Update

#### `POST /api/bulk/config-update`

Update configuration on multiple instances.

**Request:**
```json
{
  "instance_ids": ["uuid1", "uuid2"],
  "path": "apps/http/servers/srv0",
  "config": { ... }
}
```

**Response (207 Multi-Status):**
```json
{
  "success": false,
  "data": {
    "uuid1": {
      "success": true
    },
    "uuid2": {
      "success": false,
      "error": "Connection failed"
    }
  }
}
```

### Bulk Template Apply

#### `POST /api/bulk/template-apply`

Apply a template to multiple instances.

**Request:**
```json
{
  "instance_ids": ["uuid1", "uuid2"],
  "template_id": "reverse-proxy-basic",
  "variables": {
    "domain": "example.com",
    "upstream": "localhost:8080"
  },
  "path": ""
}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_IMPLEMENTED",
    "message": "Bulk template apply not yet implemented"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request body validation failed |
| `NOT_FOUND` | Resource not found |
| `LIST_FAILED` | Failed to list resources |
| `CREATE_FAILED` | Failed to create resource |
| `UPDATE_FAILED` | Failed to update resource |
| `DELETE_FAILED` | Failed to delete resource |
| `CONNECTION_FAILED` | Failed to connect to Caddy instance |
| `GET_CONFIG_FAILED` | Failed to retrieve configuration |
| `SET_CONFIG_FAILED` | Failed to set configuration |
| `PATCH_CONFIG_FAILED` | Failed to patch configuration |
| `DELETE_CONFIG_FAILED` | Failed to delete configuration |
| `ADAPT_FAILED` | Failed to adapt Caddyfile |
| `VALIDATION_FAILED` | Variable validation failed |
| `GENERATION_FAILED` | Template generation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |
| `NOT_IMPLEMENTED` | Feature not yet implemented |

---

## Examples

### Complete Workflow Example

```bash
# 1. Add a Caddy instance
curl -X POST http://localhost:3000/api/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "admin_url": "http://localhost:2019",
    "auth_type": "none"
  }'

# Response: {"success":true,"data":{"id":"abc-123",...}}

# 2. Test connection
curl -X POST http://localhost:3000/api/instances/abc-123/test-connection

# 3. Get current configuration
curl http://localhost:3000/api/instances/abc-123/config

# 4. Generate config from template
curl -X POST http://localhost:3000/api/templates/reverse-proxy-basic/generate \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "domain": "example.com",
      "upstream": "localhost:8080",
      "port": 443,
      "server_name": "srv0"
    }
  }'

# 5. Apply configuration
curl -X POST http://localhost:3000/api/instances/abc-123/config \
  -H "Content-Type: application/json" \
  -d '{
    "apps": {
      "http": {
        "servers": { ... }
      }
    }
  }'
```

---

## WebSocket Support (Future)

WebSocket endpoints for real-time updates will be added in future versions:

- `WS /api/instances/watch` - Watch instance status changes
- `WS /api/logs/stream` - Stream audit logs
- `WS /api/metrics/stream` - Stream metrics data
