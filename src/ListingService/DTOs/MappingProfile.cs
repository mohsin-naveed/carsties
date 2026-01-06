using AutoMapper;
using ListingService.DTOs;
using ListingService.Entities;

namespace ListingService.DTOs;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Make, MakeDto>();
        CreateMap<Model, ModelDto>();
        CreateMap<Generation, GenerationDto>();
        CreateMap<Variant, VariantDto>();
        CreateMap<BodyType, OptionDto>();
        CreateMap<Transmission, OptionDto>();
        CreateMap<FuelType, OptionDto>();
        CreateMap<Derivative, DerivativeDto>();

        CreateMap<Listing, ListingDto>();
        CreateMap<CreateListingDto, Listing>();
        CreateMap<UpdateListingDto, Listing>();
    }
}
