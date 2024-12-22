# Use the official Microsoft ASP.NET Core image to build the backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-backend
WORKDIR /src
COPY ["api/AzureSpeed/AzureSpeed.csproj", "backend/"]
RUN dotnet restore "backend/AzureSpeed.csproj"
COPY api/AzureSpeed/ backend/
WORKDIR "/src/backend"
RUN dotnet publish "AzureSpeed.csproj" -c Release -o /app/publish

# Use the official node image to build the Angular app
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY ["ui/package.json", "ui/package-lock.json*", "./"]
RUN npm install
COPY ui/ .
RUN npm run build

# Use a .NET runtime image to serve both the backend and frontend
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install nginx
RUN apt-get update && apt-get install -y nginx curl && rm -rf /var/lib/apt/lists/*

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy frontend dist folder to nginx html directory
COPY --from=build-frontend /app/dist/azure-speed-test/browser /usr/share/nginx/html

# Copy backend from the correct build stage
COPY --from=build-backend /app/publish /app

# Expose port 80 for the application
EXPOSE 80

# Start nginx and the .NET Core app
CMD ["sh", "-c", "dotnet /app/AzureSpeed.dll & nginx -g 'daemon off;'"]
