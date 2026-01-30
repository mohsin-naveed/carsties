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
            // Rename column only if the legacy column exists to avoid failures on fresh databases
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Listings' AND column_name = 'EngineL'
    ) THEN
        ALTER TABLE ""Listings"" RENAME COLUMN ""EngineL"" TO ""EngineSizeL"";
    END IF;
END $$;
");

            // Other columns were already introduced in the initial migration.
            // No-op here to avoid duplicate ADD COLUMN failures on fresh databases.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op for columns; only revert the rename if needed below.

            migrationBuilder.RenameColumn(
                name: "EngineSizeL",
                table: "Listings",
                newName: "EngineL");
        }
    }
}
