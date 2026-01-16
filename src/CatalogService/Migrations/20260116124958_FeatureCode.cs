using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class FeatureCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Add nullable column first
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Features",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            // 2) Backfill codes from names (uppercase, non-alphanumerics -> '-')
            migrationBuilder.Sql(@"
                UPDATE ""Features""
                SET ""Code"" = UPPER(REGEXP_REPLACE(""Name"", '[^A-Za-z0-9]+', '-', 'g'));
            ");

            // 3) Deduplicate by appending -N for duplicates
            migrationBuilder.Sql(@"
                WITH ranked AS (
                  SELECT ""Id"", ""Code"", ROW_NUMBER() OVER (PARTITION BY ""Code"" ORDER BY ""Id"") AS rn
                  FROM ""Features""
                )
                UPDATE ""Features"" f
                SET ""Code"" = CASE WHEN r.rn = 1 THEN f.""Code"" ELSE CONCAT(f.""Code"", '-', r.rn) END
                FROM ranked r
                WHERE f.""Id"" = r.""Id"";
            ");

            // 4) Set NOT NULL and create unique index
            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Features",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Features_Code",
                table: "Features",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Features_Code",
                table: "Features");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Features");
        }
    }
}
