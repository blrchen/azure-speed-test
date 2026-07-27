# Stage 1: Build the .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-backend
WORKDIR /src
COPY ["api/AzureSpeed/AzureSpeed.csproj", "backend/"]
RUN dotnet restore "backend/AzureSpeed.csproj"
COPY api/AzureSpeed/ backend/
WORKDIR "/src/backend"
RUN dotnet publish "AzureSpeed.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Build the Angular app (static prerender)
FROM node:22-alpine AS build-frontend
WORKDIR /app
COPY ["ui/package.json", "ui/package-lock.json*", "./"]
RUN npm ci --no-audit --fund=false
COPY ui/ .
RUN npm run build

# Stage 3: Final runtime - nginx serves static files and proxies API to .NET
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libnginx-mod-http-brotli-filter \
        libnginx-mod-http-brotli-static \
        nginx \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

ENV ASPNETCORE_URLS=http://127.0.0.1:5000 \
    Kestrel__Endpoints__Http__Url=http://127.0.0.1:5000

# Copy .NET backend
COPY --from=build-backend /app/publish .

# Copy Angular browser build (prerendered HTML + hashed assets) into nginx web root
COPY --from=build-frontend /app/dist/azure-speed-test/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/azure-speed-test.conf

EXPOSE 8080

CMD ["sh", "-c", "dotnet /app/AzureSpeed.dll & exec nginx -g 'daemon off;'"]
