# https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/building-net-docker-images

# https://hub.docker.com/_/microsoft-dotnet
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build

# Update package list and install curl
RUN apt-get update && \
    apt-get install -y curl && \
    # Install Node.js 18.x
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    # Clean up package list
    rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY ./src .
WORKDIR /src/AzureSpeed.WebApp
RUN dotnet restore
RUN dotnet publish -c release -o /app --no-restore

# final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:6.0
WORKDIR /app
COPY --from=build /app ./
EXPOSE 80
ENTRYPOINT ["dotnet", "AzureSpeed.WebApp.dll"]