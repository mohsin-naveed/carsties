using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ListingService.Migrations
{
    /// <inheritdoc />
    public partial class LocationExtensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EngineL",
                table: "Listings",
                newName: "EngineSizeL");

            migrationBuilder.AddColumn<string>(
                name: "AreaCode",
                table: "Listings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AreaName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BodyColor",
                table: "Listings",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CityCode",
                table: "Listings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CityName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "Listings",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "Listings",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvinceCode",
                table: "Listings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProvinceName",
                table: "Listings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AreaCode",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "AreaName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "BodyColor",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "CityCode",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "CityName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ProvinceCode",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "ProvinceName",
                table: "Listings");

            migrationBuilder.RenameColumn(
                name: "EngineSizeL",
                table: "Listings",
                newName: "EngineL");
        }
    }
}
