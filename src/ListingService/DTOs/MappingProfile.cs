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
        // For updates, ignore nulls to avoid overwriting existing values
        CreateMap<UpdateListingDto, Listing>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        CreateMap<ListingImage, ListingImageDto>();
    }
}
