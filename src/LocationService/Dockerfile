FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY Carsties.sln ./
COPY src/LocationService/LocationService.csproj ./src/LocationService/
COPY src/Contracts/Contracts.csproj ./src/Contracts/

RUN dotnet restore ./src/LocationService/LocationService.csproj

COPY . . 
RUN dotnet publish ./src/LocationService/LocationService.csproj -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 80
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "LocationService.dll"]
