using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class FeatureCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Create FeatureCategories
            migrationBuilder.CreateTable(
                name: "FeatureCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureCategories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeatureCategories_Code",
                table: "FeatureCategories",
                column: "Code",
                unique: true);

            // 2) Add nullable FK column to Features and index
            migrationBuilder.AddColumn<int>(
                name: "FeatureCategoryId",
                table: "Features",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Features_FeatureCategoryId",
                table: "Features",
                column: "FeatureCategoryId");

            // 3) Backfill FK values for existing features
            migrationBuilder.Sql(@"
                DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM ""FeatureCategories"" WHERE ""Name"" = 'Exterior') THEN
                    INSERT INTO ""FeatureCategories"" (""Code"", ""Name"") VALUES ('EXTERIOR', 'Exterior');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM ""FeatureCategories"" WHERE ""Name"" = 'Interior') THEN
                    INSERT INTO ""FeatureCategories"" (""Code"", ""Name"") VALUES ('INTERIOR', 'Interior');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM ""FeatureCategories"" WHERE ""Name"" = 'SafetySecurity') THEN
                    INSERT INTO ""FeatureCategories"" (""Code"", ""Name"") VALUES ('SAFETYSECURITY', 'SafetySecurity');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM ""FeatureCategories"" WHERE ""Name"" = 'ComfortConvenience') THEN
                    INSERT INTO ""FeatureCategories"" (""Code"", ""Name"") VALUES ('COMFORTCONVENIENCE', 'ComfortConvenience');
                END IF;
                END $$;

                UPDATE ""Features"" f SET ""FeatureCategoryId"" = (
                    SELECT c.""Id"" FROM ""FeatureCategories"" c
                    WHERE (
                        CASE
                            WHEN f.""Name"" ILIKE '%sunroof%' THEN 'Exterior'
                            WHEN f.""Name"" ILIKE '%abs%' OR f.""Name"" ILIKE '%airbag%' THEN 'SafetySecurity'
                            WHEN f.""Name"" ILIKE '%air conditioning%' OR f.""Name"" ILIKE '%cruise%' OR f.""Name"" ILIKE '%bluetooth%' THEN 'ComfortConvenience'
                            ELSE 'Interior'
                        END
                    ) = c.""Name""
                    LIMIT 1
                )
                WHERE f.""FeatureCategoryId"" IS NULL;
            ");

            // 4) Set NOT NULL and add FK
            migrationBuilder.AlterColumn<int>(
                name: "FeatureCategoryId",
                table: "Features",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Features_FeatureCategories_FeatureCategoryId",
                table: "Features",
                column: "FeatureCategoryId",
                principalTable: "FeatureCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Features_FeatureCategories_FeatureCategoryId",
                table: "Features");

            migrationBuilder.DropIndex(
                name: "IX_Features_FeatureCategoryId",
                table: "Features");

            migrationBuilder.DropColumn(
                name: "FeatureCategoryId",
                table: "Features");

            migrationBuilder.DropTable(
                name: "FeatureCategories");
        }
    }
}
