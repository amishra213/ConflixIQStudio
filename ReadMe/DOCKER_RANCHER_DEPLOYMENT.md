# Docker Deployment with Rancher Desktop

This guide explains how to deploy and run ConductorDesigner using Rancher Desktop.

## Prerequisites

- **Rancher Desktop** installed and running
- **Container runtime**: containerd or dockerd (either works)
- **Kubernetes**: Can be disabled for Docker-only deployment
- **nerdctl** or **docker** CLI available (comes with Rancher Desktop)

## Quick Start

### 1. Clone/Navigate to Project

```powershell
cd D:\Projects\ConductorDesigner
```

### 2. Choose Your Build Method

#### Option A: Docker Compose (Recommended)

```powershell
# Using nerdctl (default in Rancher Desktop)
nerdctl compose up -d

# Or using docker CLI (if configured in Rancher)
docker compose up -d
```

#### Option B: Manual Build and Run

```powershell
# Build the image
nerdctl build -t conductor-designer:latest .

# Run the container
nerdctl run -d `
  --name conductor-designer `
  -p 4000:4000 `
  -p 5173:5173 `
  -v conductor-logs:/app/logs `
  -v conductor-filestore:/app/.filestore `
  -e VITE_CONDUCTOR_SERVER_URL=http://localhost:8080 `
  conductor-designer:latest
```

### 3. Access the Application

Open your browser and navigate to:
- **Application UI**: http://localhost:4000
- **Development Server** (if running): http://localhost:5173

## Detailed Instructions

### Using Rancher Desktop GUI

1. **Open Rancher Desktop**
   - Start Rancher Desktop application
   - Wait for it to be fully ready (green checkmark)

2. **Choose Container Runtime**
   - Go to **Preferences** → **Container Engine**
   - Select either `containerd (nerdctl)` or `dockerd (docker)`
   - Apply and wait for restart

3. **Build via GUI** (Optional)
   - In Rancher Desktop, go to **Images**
   - Click **Build** or use CLI commands below

### Using CLI (Recommended)

#### With nerdctl (Rancher Default)

```powershell
# Check nerdctl is available
nerdctl version

# Build the image
nerdctl build -t conductor-designer:latest .

# Verify image was created
nerdctl images | Select-String "conductor-designer"

# Run with docker-compose
nerdctl compose -f docker-compose.yml up -d

# Check running containers
nerdctl ps

# View logs
nerdctl logs -f conductor-designer
```

#### With docker CLI

```powershell
# Check docker is available
docker version

# Build the image
docker build -t conductor-designer:latest .

# Run with docker-compose
docker compose up -d

# Check running containers
docker ps

# View logs
docker logs -f conductor-designer
```

## Configuration

### Environment Variables

Create or edit `.env` file in project root:

```properties
# Conductor Server Configuration
VITE_CONDUCTOR_SERVER_URL=http://localhost:8080
VITE_CONDUCTOR_API_KEY=

# Application Settings
VITE_APP_NAME=BYConductorStudio
VITE_LOG_FOLDER=./logs
VITE_ENABLE_LOGGING=true
VITE_LOG_LEVEL=info
```

### Port Mapping

Default ports (can be changed in docker-compose.yml):
- **4000**: Backend API and GraphQL server
- **5173**: Frontend development server (optional)

### Volume Mounts

The application uses persistent volumes:
- **conductor-logs**: Application log files
- **conductor-filestore**: Workflow and configuration cache

## Accessing the Application

### 1. Web Interface

Once the container is running, open your browser:

```
http://localhost:4000
```

You should see the ConductorDesigner interface.

### 2. Health Check

Verify the application is healthy:

```powershell
# Using curl (install if needed: winget install curl)
curl http://localhost:4000/health

# Using Invoke-WebRequest (PowerShell)
Invoke-WebRequest -Uri http://localhost:4000/health

# Expected response: HTTP 200 OK
```

### 3. GraphQL Playground (if enabled)

```
http://localhost:4000/graphql
```

## Managing the Application

### Start/Stop

```powershell
# Start
nerdctl compose up -d

# Stop
nerdctl compose stop

# Stop and remove containers
nerdctl compose down

# Stop and remove containers + volumes
nerdctl compose down -v
```

### View Logs

```powershell
# Container logs (stdout/stderr)
nerdctl logs conductor-designer

# Follow logs in real-time
nerdctl logs -f conductor-designer

# Last 100 lines
nerdctl logs --tail 100 conductor-designer

# Application log files
nerdctl exec conductor-designer cat /app/logs/conductor-designer-$(Get-Date -Format yyyy-MM-dd).log

# Follow application logs
nerdctl exec conductor-designer tail -f /app/logs/conductor-designer-$(Get-Date -Format yyyy-MM-dd).log
```

### Access Container Shell

```powershell
# Enter the container
nerdctl exec -it conductor-designer /bin/sh

# Once inside, you can explore
cd /app
ls -la
cat logs/conductor-designer-*.log
exit
```

### Restart Container

```powershell
# Restart
nerdctl restart conductor-designer

# Or using compose
nerdctl compose restart
```

### Update and Rebuild

```powershell
# Pull latest changes (if from Git)
git pull

# Rebuild and restart
nerdctl compose up -d --build

# Or manually
nerdctl build -t conductor-designer:latest .
nerdctl compose up -d --force-recreate
```

## Troubleshooting

### Container Won't Start

1. **Check Rancher Desktop is running**
   ```powershell
   nerdctl version
   ```

2. **Check for port conflicts**
   ```powershell
   # Check if port 4000 is in use
   netstat -ano | Select-String ":4000"
   
   # Kill process if needed (replace PID)
   Stop-Process -Id <PID> -Force
   ```

3. **Check container logs**
   ```powershell
   nerdctl logs conductor-designer
   ```

4. **Check container status**
   ```powershell
   nerdctl ps -a
   ```

### Can't Access on localhost:4000

1. **Verify container is running**
   ```powershell
   nerdctl ps | Select-String "conductor-designer"
   ```

2. **Check port binding**
   ```powershell
   nerdctl port conductor-designer
   # Should show: 4000/tcp -> 0.0.0.0:4000
   ```

3. **Test from inside container**
   ```powershell
   nerdctl exec conductor-designer wget -qO- http://localhost:4000/health
   ```

4. **Check Windows Firewall**
   - Open Windows Defender Firewall
   - Allow ports 4000 and 5173 if blocked

### Logs Not Appearing

1. **Check volume mount**
   ```powershell
   nerdctl volume ls | Select-String "conductor-logs"
   nerdctl volume inspect conductor-logs
   ```

2. **Check inside container**
   ```powershell
   nerdctl exec conductor-designer ls -la /app/logs
   ```

3. **Check permissions**
   ```powershell
   nerdctl exec conductor-designer ls -ld /app/logs
   ```

### Error: "Cannot connect to Conductor server"

This is **expected** if you don't have a Conductor server running. The application works offline with reduced functionality.

To connect to a Conductor server:

1. **Update environment variable**
   ```powershell
   # Edit .env file or docker-compose.yml
   # Set: VITE_CONDUCTOR_SERVER_URL=http://your-conductor-host:8080
   ```

2. **Restart container**
   ```powershell
   nerdctl compose down
   nerdctl compose up -d
   ```

### Out of Disk Space

```powershell
# Check disk usage
nerdctl system df

# Clean up
nerdctl system prune -a

# Remove unused volumes
nerdctl volume prune
```

## Advanced Configuration

### Custom Network

```powershell
# Create custom network
nerdctl network create conductor-network

# Run container on custom network
nerdctl run -d `
  --name conductor-designer `
  --network conductor-network `
  -p 4000:4000 `
  conductor-designer:latest
```

### Connect to External Conductor Server

If running Conductor server in another container:

```yaml
# docker-compose.yml
services:
  conductor-designer:
    # ... existing config ...
    environment:
      - VITE_CONDUCTOR_SERVER_URL=http://conductor-server:8080
    depends_on:
      - conductor-server
  
  conductor-server:
    image: netflix/conductor:latest
    ports:
      - "8080:8080"
```

### Volume Backup

```powershell
# Backup logs
nerdctl run --rm `
  -v conductor-logs:/source `
  -v ${PWD}/backup:/backup `
  alpine tar -czf /backup/logs-backup-$(Get-Date -Format yyyyMMdd).tar.gz -C /source .

# Restore logs
nerdctl run --rm `
  -v conductor-logs:/target `
  -v ${PWD}/backup:/backup `
  alpine tar -xzf /backup/logs-backup-20251201.tar.gz -C /target
```

### Resource Limits

```powershell
# Run with resource limits
nerdctl run -d `
  --name conductor-designer `
  --memory=512m `
  --cpus=1 `
  -p 4000:4000 `
  conductor-designer:latest
```

## Rancher Desktop Specific Features

### Kubernetes Deployment (Optional)

If you want to deploy to Kubernetes via Rancher Desktop:

1. **Enable Kubernetes** in Rancher Desktop settings
2. **Create Kubernetes manifests** (deployment.yaml, service.yaml)
3. **Deploy using kubectl**:
   ```powershell
   kubectl apply -f k8s/
   ```

### Image Scanning

Rancher Desktop supports Trivy for image scanning:

```powershell
# Scan image for vulnerabilities
nerdctl run --rm aquasec/trivy image conductor-designer:latest
```

### Registry Push

To push to a registry:

```powershell
# Tag image
nerdctl tag conductor-designer:latest registry.example.com/conductor-designer:latest

# Login to registry
nerdctl login registry.example.com

# Push
nerdctl push registry.example.com/conductor-designer:latest
```

## Performance Optimization

### Windows Specific

1. **WSL2 Backend**: Ensure Rancher Desktop uses WSL2 for better performance
2. **Resource Allocation**: 
   - Go to Rancher Desktop → Preferences → WSL
   - Allocate sufficient CPU and Memory (recommended: 4GB RAM, 2 CPUs)

3. **Exclude from Antivirus**: Add Docker/Rancher directories to Windows Defender exclusions:
   - `%USERPROFILE%\.rd`
   - `C:\Program Files\Rancher Desktop`

## Monitoring

### Check Container Stats

```powershell
# Real-time stats
nerdctl stats conductor-designer

# One-time stats
nerdctl stats --no-stream conductor-designer
```

### Health Checks

The container includes a built-in health check:

```powershell
# Check health status
nerdctl inspect conductor-designer | Select-String "Health"

# View health check logs
nerdctl inspect conductor-designer --format='{{json .State.Health}}' | ConvertFrom-Json
```

## Uninstalling

### Remove Container and Volumes

```powershell
# Stop and remove container
nerdctl compose down

# Remove with volumes
nerdctl compose down -v

# Remove image
nerdctl rmi conductor-designer:latest

# Clean up all unused resources
nerdctl system prune -a --volumes
```

## Common Commands Reference

| Task | Command |
|------|---------|
| Build image | `nerdctl build -t conductor-designer:latest .` |
| Start app | `nerdctl compose up -d` |
| Stop app | `nerdctl compose stop` |
| View logs | `nerdctl logs -f conductor-designer` |
| Shell access | `nerdctl exec -it conductor-designer /bin/sh` |
| Restart | `nerdctl compose restart` |
| Update & rebuild | `nerdctl compose up -d --build` |
| Remove everything | `nerdctl compose down -v` |

## Getting Help

- **Container logs**: `nerdctl logs conductor-designer`
- **Application logs**: Check `/app/logs/` in container
- **Health check**: http://localhost:4000/health
- **Rancher Desktop docs**: https://docs.rancherdesktop.io/

## Next Steps

1. **Configure Conductor Connection**: Update `VITE_CONDUCTOR_SERVER_URL` in `.env`
2. **Create Workflows**: Use the web interface at http://localhost:4000
3. **Monitor Logs**: Check Error Monitor in UI or log files
4. **Backup Data**: Regularly backup `conductor-logs` and `conductor-filestore` volumes

---

**Note**: All commands use `nerdctl` (Rancher Desktop default). If you configured Rancher to use `dockerd`, replace `nerdctl` with `docker` in all commands.
