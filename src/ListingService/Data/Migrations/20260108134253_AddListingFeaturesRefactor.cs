using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ListingService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddListingFeaturesRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Listings_BodyTypes_BodyTypeId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Derivatives_DerivativeId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_FuelTypes_FuelTypeId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Generations_GenerationId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Makes_MakeId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Models_ModelId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Transmissions_TransmissionId",
                table: "Listings");

            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Variants_VariantId",
                table: "Listings");

            migrationBuilder.DropTable(
                name: "Variants");

            migrationBuilder.DropTable(
                name: "Derivatives");

            migrationBuilder.DropTable(
                name: "BodyTypes");

            migrationBuilder.DropTable(
                name: "FuelTypes");

            migrationBuilder.DropTable(
                name: "Generations");

            migrationBuilder.DropTable(
                name: "Transmissions");

            migrationBuilder.DropTable(
                name: "Models");

            migrationBuilder.DropTable(
                name: "Makes");

            migrationBuilder.DropIndex(
                name: "IX_Listings_BodyTypeId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_DerivativeId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_FuelTypeId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_GenerationId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_MakeId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_ModelId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_TransmissionId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_VariantId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Features_Name",
                table: "Features");

            migrationBuilder.DropColumn(
                name: "VariantFeaturesJson",
                table: "Listings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VariantFeaturesJson",
                table: "Listings",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BodyTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BodyTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FuelTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Makes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Makes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Transmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transmissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Models",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MakeId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Models", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Models_Makes_MakeId",
                        column: x => x.MakeId,
                        principalTable: "Makes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Generations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    EndYear = table.Column<short>(type: "smallint", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StartYear = table.Column<short>(type: "smallint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Generations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Generations_Models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "Models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Derivatives",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BodyTypeId = table.Column<int>(type: "integer", nullable: false),
                    FuelTypeId = table.Column<int>(type: "integer", nullable: true),
                    GenerationId = table.Column<int>(type: "integer", nullable: false),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    TransmissionId = table.Column<int>(type: "integer", nullable: true),
                    BatteryCapacityKWh = table.Column<decimal>(type: "numeric", nullable: true),
                    Doors = table.Column<short>(type: "smallint", nullable: false),
                    Engine = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Seats = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Derivatives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Derivatives_BodyTypes_BodyTypeId",
                        column: x => x.BodyTypeId,
                        principalTable: "BodyTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Derivatives_FuelTypes_FuelTypeId",
                        column: x => x.FuelTypeId,
                        principalTable: "FuelTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Derivatives_Generations_GenerationId",
                        column: x => x.GenerationId,
                        principalTable: "Generations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Derivatives_Models_ModelId",
                        column: x => x.ModelId,
                        principalTable: "Models",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Derivatives_Transmissions_TransmissionId",
                        column: x => x.TransmissionId,
                        principalTable: "Transmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Variants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DerivativeId = table.Column<int>(type: "integer", nullable: false),
                    FuelTypeId = table.Column<int>(type: "integer", nullable: true),
                    TransmissionId = table.Column<int>(type: "integer", nullable: true),
                    Engine = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Variants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Variants_Derivatives_DerivativeId",
                        column: x => x.DerivativeId,
                        principalTable: "Derivatives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Variants_FuelTypes_FuelTypeId",
                        column: x => x.FuelTypeId,
                        principalTable: "FuelTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Variants_Transmissions_TransmissionId",
                        column: x => x.TransmissionId,
                        principalTable: "Transmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_BodyTypeId",
                table: "Listings",
                column: "BodyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_DerivativeId",
                table: "Listings",
                column: "DerivativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_FuelTypeId",
                table: "Listings",
                column: "FuelTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_GenerationId",
                table: "Listings",
                column: "GenerationId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_MakeId",
                table: "Listings",
                column: "MakeId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_ModelId",
                table: "Listings",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_TransmissionId",
                table: "Listings",
                column: "TransmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Listings_VariantId",
                table: "Listings",
                column: "VariantId");

            migrationBuilder.CreateIndex(
                name: "IX_Features_Name",
                table: "Features",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BodyTypes_Name",
                table: "BodyTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_BodyTypeId",
                table: "Derivatives",
                column: "BodyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_FuelTypeId",
                table: "Derivatives",
                column: "FuelTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_GenerationId",
                table: "Derivatives",
                column: "GenerationId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_ModelId",
                table: "Derivatives",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Derivatives_TransmissionId",
                table: "Derivatives",
                column: "TransmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_FuelTypes_Name",
                table: "FuelTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Generations_ModelId",
                table: "Generations",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Makes_Name",
                table: "Makes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Models_MakeId",
                table: "Models",
                column: "MakeId");

            migrationBuilder.CreateIndex(
                name: "IX_Transmissions_Name",
                table: "Transmissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Variants_DerivativeId",
                table: "Variants",
                column: "DerivativeId");

            migrationBuilder.CreateIndex(
                name: "IX_Variants_FuelTypeId",
                table: "Variants",
                column: "FuelTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Variants_TransmissionId",
                table: "Variants",
                column: "TransmissionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_BodyTypes_BodyTypeId",
                table: "Listings",
                column: "BodyTypeId",
                principalTable: "BodyTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Derivatives_DerivativeId",
                table: "Listings",
                column: "DerivativeId",
                principalTable: "Derivatives",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_FuelTypes_FuelTypeId",
                table: "Listings",
                column: "FuelTypeId",
                principalTable: "FuelTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Generations_GenerationId",
                table: "Listings",
                column: "GenerationId",
                principalTable: "Generations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Makes_MakeId",
                table: "Listings",
                column: "MakeId",
                principalTable: "Makes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Models_ModelId",
                table: "Listings",
                column: "ModelId",
                principalTable: "Models",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Transmissions_TransmissionId",
                table: "Listings",
                column: "TransmissionId",
                principalTable: "Transmissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Variants_VariantId",
                table: "Listings",
                column: "VariantId",
                principalTable: "Variants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
