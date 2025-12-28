# Use the official Microsoft ASP.NET Core image to build the backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-backend
WORKDIR /src
COPY ["api/AzureSpeed/AzureSpeed.csproj", "backend/"]
RUN dotnet restore "backend/AzureSpeed.csproj"
COPY api/AzureSpeed/ backend/
WORKDIR "/src/backend"
RUN dotnet publish "AzureSpeed.csproj" -c Release -o /app/publish

# Use the official node image to build the Angular app
FROM node:22-alpine AS build-frontend
WORKDIR /app
COPY ["ui/package.json", "ui/package-lock.json*", "./"]
RUN npm install
COPY ui/ .
RUN npm run build

# Use a .NET runtime image with Node.js for SSR
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install Node.js 22.x
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Angular SSR build (includes both browser and server bundles)
COPY --from=build-frontend /app/dist/azure-speed-test /app/frontend

# Copy .NET backend
COPY --from=build-backend /app/publish /app/backend

# Expose port 80 for the application
EXPOSE 80

# Start Node.js SSR server and .NET API backend
# Node.js listens on PORT (default 80), .NET listens on 8080
# Run .NET from backend directory so ContentRootPath resolves Data/settings.json correctly
CMD ["sh", "-c", "(cd /app/backend && dotnet AzureSpeed.dll) & PORT=80 node /app/frontend/server/server.mjs"]
