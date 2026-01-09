using AutoMapper;
using ListingService.DTOs;
using ListingService.Entities;

namespace ListingService.DTOs;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Listing, ListingDto>();
        CreateMap<CreateListingDto, Listing>();
        CreateMap<UpdateListingDto, Listing>();
        CreateMap<ListingImage, ListingImageDto>();
    }
}
