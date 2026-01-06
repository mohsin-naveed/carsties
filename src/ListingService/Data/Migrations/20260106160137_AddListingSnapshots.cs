using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ListingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddListingSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BatteryCapacityKWhSnapshot",
                table: "Listings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BodyTypeName",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DerivativeName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "DoorsSnapshot",
                table: "Listings",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EngineSnapshot",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FuelTypeName",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenerationName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MakeName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModelName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "SeatsSnapshot",
                table: "Listings",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransmissionName",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VariantName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BatteryCapacityKWhSnapshot",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "BodyTypeName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "DerivativeName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "DoorsSnapshot",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "EngineSnapshot",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "FuelTypeName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "GenerationName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MakeName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ModelName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "SeatsSnapshot",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "TransmissionName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "VariantName",
                table: "Listings");
        }
    }
}
