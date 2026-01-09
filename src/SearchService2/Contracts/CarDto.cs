namespace CarSearch.Api.Contracts;

public sealed record CarDto(int StockNumber, string Registration, string Make, string Model, string Spec, decimal AskingPrice);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);