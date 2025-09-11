# Build stage for frontend assets
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY src/ ./src/
COPY tailwind.config.js postcss.config.js tsconfig.json ./

# Build frontend assets
RUN npm run build

# Build stage for Go application
FROM golang:1.21-alpine AS go-builder

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy Go source
COPY . .

# Copy built frontend assets from previous stage
COPY --from=frontend-builder /app/static/css ./static/css
COPY --from=frontend-builder /app/static/js ./static/js

# Build Go application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates
RUN update-ca-certificates

WORKDIR /root/

# Copy the binary and static assets
COPY --from=go-builder /app/main .
COPY --from=go-builder /app/static ./static
COPY --from=go-builder /app/templates ./templates

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]
