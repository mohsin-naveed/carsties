using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    public partial class AddPlugInHybridFuelType : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("INSERT INTO \"FuelTypes\" (\"Name\") SELECT 'Plug-In Hybrid' WHERE NOT EXISTS (SELECT 1 FROM \"FuelTypes\" WHERE \"Name\"='Plug-In Hybrid');");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"FuelTypes\" WHERE \"Name\"='Plug-In Hybrid';");
        }
    }
}
