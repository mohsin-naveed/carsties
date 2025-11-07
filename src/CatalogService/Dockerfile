FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY Carsties.sln ./
COPY src/CatalogService/CatalogService.csproj ./src/CatalogService/CatalogService/
COPY src/Contracts/Contracts.csproj ./src/Contracts/

RUN dotnet restore ./src/CatalogService/CatalogService.csproj

COPY . . 
RUN dotnet publish ./src/CatalogService/CatalogService.csproj -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 80
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CatalogService.dll"]