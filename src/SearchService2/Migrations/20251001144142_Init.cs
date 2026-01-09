using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSearch.Api.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeatureTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SearchSlug = table.Column<string>(type: "TEXT", nullable: false),
                    StockFeatureTypeID = table.Column<int>(type: "INTEGER", nullable: false),
                    FriendlyName = table.Column<string>(type: "TEXT", nullable: false),
                    IconHref = table.Column<string>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    ShowInSearchFilters = table.Column<bool>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureTypes", x => x.Id);
                    table.UniqueConstraint("AK_FeatureTypes_StockFeatureTypeID", x => x.StockFeatureTypeID);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    TagID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    UserID = table.Column<int>(type: "INTEGER", nullable: false),
                    DateAdded = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DateRemoved = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ShowsSashOnWebsite = table.Column<bool>(type: "INTEGER", nullable: false),
                    SashColorHtmlHexCode = table.Column<string>(type: "TEXT", nullable: false),
                    IsVisibleInWebsiteSearch = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsVisibleOnWebsite = table.Column<bool>(type: "INTEGER", nullable: false),
                    WebsiteClickHref = table.Column<string>(type: "TEXT", nullable: false),
                    HoverDescription = table.Column<string>(type: "TEXT", nullable: false),
                    Priority = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.TagID);
                });

            migrationBuilder.CreateTable(
                name: "Cars",
                columns: table => new
                {
                    StockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Registration = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Make = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Spec = table.Column<string>(type: "TEXT", nullable: false),
                    AskingPrice = table.Column<decimal>(type: "TEXT", nullable: false),
                    AskingPriceWithoutCompulsoryRetailCustomerFee = table.Column<decimal>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", nullable: false),
                    DisplayLocation = table.Column<string>(type: "TEXT", nullable: false),
                    DestinationLocation = table.Column<string>(type: "TEXT", nullable: false),
                    SiteID = table.Column<int>(type: "INTEGER", nullable: false),
                    DestinationSiteID = table.Column<int>(type: "INTEGER", nullable: false),
                    IsInStorage = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsInPreparation = table.Column<bool>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    KeyFeaturesString = table.Column<string>(type: "TEXT", nullable: false),
                    StatusEnum = table.Column<int>(type: "INTEGER", nullable: false),
                    DateRegistered = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Engine = table.Column<string>(type: "TEXT", nullable: false),
                    Mileage = table.Column<int>(type: "INTEGER", nullable: false),
                    EnginePower = table.Column<int>(type: "INTEGER", nullable: false),
                    Fuel = table.Column<string>(type: "TEXT", nullable: false),
                    Transmission = table.Column<string>(type: "TEXT", nullable: false),
                    Colour = table.Column<string>(type: "TEXT", nullable: false),
                    TwitterImageToUse = table.Column<string>(type: "TEXT", nullable: true),
                    LowestMonthlyPayment = table.Column<int>(type: "INTEGER", nullable: false),
                    FinanceQuoteType = table.Column<int>(type: "INTEGER", nullable: false),
                    OptionalExstrasTotalValue = table.Column<int>(type: "INTEGER", nullable: false),
                    PriceLabel = table.Column<string>(type: "TEXT", nullable: false),
                    Savings = table.Column<string>(type: "TEXT", nullable: false),
                    SaleText = table.Column<string>(type: "TEXT", nullable: false),
                    RRP_Autotrader = table.Column<int>(type: "INTEGER", nullable: false),
                    AT_Position = table.Column<int>(type: "INTEGER", nullable: false),
                    MakeFullName = table.Column<string>(type: "TEXT", nullable: false),
                    MainThumbnailImage = table.Column<string>(type: "TEXT", nullable: false),
                    HasImages = table.Column<bool>(type: "INTEGER", nullable: false),
                    ResultImageSrcBlurred = table.Column<string>(type: "TEXT", nullable: false),
                    CarDefaultImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    HeadlineDescription = table.Column<string>(type: "TEXT", nullable: false),
                    HeadlineDescriptionNoYear = table.Column<string>(type: "TEXT", nullable: false),
                    YearString = table.Column<string>(type: "TEXT", nullable: false),
                    HeadlineCaption = table.Column<string>(type: "TEXT", nullable: false),
                    MOTExpiry = table.Column<string>(type: "TEXT", nullable: false),
                    WebsiteURL = table.Column<string>(type: "TEXT", nullable: false),
                    WebsitePrintURL = table.Column<string>(type: "TEXT", nullable: false),
                    RegistrationPlateNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    CarAge = table.Column<int>(type: "INTEGER", nullable: false),
                    CarAgeBand = table.Column<int>(type: "INTEGER", nullable: false),
                    EngineSizeString = table.Column<string>(type: "TEXT", nullable: false),
                    EnginePowerBand = table.Column<int>(type: "INTEGER", nullable: false),
                    Doors = table.Column<int>(type: "INTEGER", nullable: false),
                    PreviousKeepers = table.Column<int>(type: "INTEGER", nullable: false),
                    Seats = table.Column<int>(type: "INTEGER", nullable: false),
                    BHP = table.Column<int>(type: "INTEGER", nullable: false),
                    MPG = table.Column<int>(type: "INTEGER", nullable: false),
                    MPGBand = table.Column<int>(type: "INTEGER", nullable: false),
                    BodyType = table.Column<string>(type: "TEXT", nullable: false),
                    Co2 = table.Column<string>(type: "TEXT", nullable: false),
                    InsuranceGroupLetter = table.Column<string>(type: "TEXT", nullable: false),
                    IsULEZ = table.Column<bool>(type: "INTEGER", nullable: false),
                    PrimaryTagId = table.Column<int>(type: "INTEGER", nullable: true),
                    WasPrice = table.Column<int>(type: "INTEGER", nullable: false),
                    WasPriceSaving = table.Column<int>(type: "INTEGER", nullable: false),
                    BatteryCapacityKWH = table.Column<decimal>(type: "TEXT", nullable: false),
                    BatteryUsableCapacityKWH = table.Column<decimal>(type: "TEXT", nullable: false),
                    BatteryRangeMiles = table.Column<int>(type: "INTEGER", nullable: false),
                    InsuranceGroup = table.Column<int>(type: "INTEGER", nullable: false),
                    InsuranceLevel = table.Column<int>(type: "INTEGER", nullable: false),
                    InsuranceSecurityCode = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cars", x => x.StockNumber);
                    table.ForeignKey(
                        name: "FK_Cars_Tags_PrimaryTagId",
                        column: x => x.PrimaryTagId,
                        principalTable: "Tags",
                        principalColumn: "TagID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CarImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Url = table.Column<string>(type: "TEXT", nullable: false),
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CarImages_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CarTags",
                columns: table => new
                {
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    TagID = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarTags", x => new { x.CarStockNumber, x.TagID });
                    table.ForeignKey(
                        name: "FK_CarTags_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CarTags_Tags_TagID",
                        column: x => x.TagID,
                        principalTable: "Tags",
                        principalColumn: "TagID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChargeTimes",
                columns: table => new
                {
                    ChargeTimeID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StockNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    ChargerType = table.Column<string>(type: "TEXT", nullable: false),
                    ChargerDescription = table.Column<string>(type: "TEXT", nullable: false),
                    ChargerSupplyType = table.Column<string>(type: "TEXT", nullable: false),
                    ConnectorType = table.Column<string>(type: "TEXT", nullable: false),
                    StartBatteryPercentage = table.Column<int>(type: "INTEGER", nullable: false),
                    EndBatteryPercentage = table.Column<int>(type: "INTEGER", nullable: false),
                    DurationMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChargeTimes", x => x.ChargeTimeID);
                    table.ForeignKey(
                        name: "FK_ChargeTimes_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DepositQuotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DepositAmount = table.Column<int>(type: "INTEGER", nullable: false),
                    Value = table.Column<int>(type: "INTEGER", nullable: false),
                    QuoteType = table.Column<int>(type: "INTEGER", nullable: false),
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepositQuotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepositQuotes_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Features",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StockFeatureEntryID = table.Column<int>(type: "INTEGER", nullable: false),
                    StockFeatureTypeID = table.Column<int>(type: "INTEGER", nullable: false),
                    StockNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    DateAdded = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DateVerified = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DateRemoved = table.Column<DateTime>(type: "TEXT", nullable: true),
                    BigUserIDVerified = table.Column<int>(type: "INTEGER", nullable: true),
                    BigUserIDRemoved = table.Column<int>(type: "INTEGER", nullable: true),
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Features", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Features_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Features_FeatureTypes_StockFeatureTypeID",
                        column: x => x.StockFeatureTypeID,
                        principalTable: "FeatureTypes",
                        principalColumn: "StockFeatureTypeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SliderImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClearImage = table.Column<string>(type: "TEXT", nullable: false),
                    CarStockNumber = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SliderImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SliderImages_Cars_CarStockNumber",
                        column: x => x.CarStockNumber,
                        principalTable: "Cars",
                        principalColumn: "StockNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CarImages_CarStockNumber",
                table: "CarImages",
                column: "CarStockNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Cars_PrimaryTagId",
                table: "Cars",
                column: "PrimaryTagId");

            migrationBuilder.CreateIndex(
                name: "IX_CarTags_TagID",
                table: "CarTags",
                column: "TagID");

            migrationBuilder.CreateIndex(
                name: "IX_ChargeTimes_CarStockNumber",
                table: "ChargeTimes",
                column: "CarStockNumber");

            migrationBuilder.CreateIndex(
                name: "IX_DepositQuotes_CarStockNumber",
                table: "DepositQuotes",
                column: "CarStockNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Features_CarStockNumber",
                table: "Features",
                column: "CarStockNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Features_StockFeatureTypeID",
                table: "Features",
                column: "StockFeatureTypeID");

            migrationBuilder.CreateIndex(
                name: "IX_SliderImages_CarStockNumber",
                table: "SliderImages",
                column: "CarStockNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CarImages");

            migrationBuilder.DropTable(
                name: "CarTags");

            migrationBuilder.DropTable(
                name: "ChargeTimes");

            migrationBuilder.DropTable(
                name: "DepositQuotes");

            migrationBuilder.DropTable(
                name: "Features");

            migrationBuilder.DropTable(
                name: "SliderImages");

            migrationBuilder.DropTable(
                name: "FeatureTypes");

            migrationBuilder.DropTable(
                name: "Cars");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
