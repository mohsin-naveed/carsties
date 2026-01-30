using AutoMapper;
using LocationService.DTOs;
using LocationService.Entities;

namespace LocationService.RequestHelpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<Province, ProvinceDto>();
        CreateMap<City, CityDto>()
            .ForCtorParam("ProvinceName", o => o.MapFrom(s => s.Province != null ? s.Province.Name : null));
        CreateMap<Area, AreaDto>()
            .ForCtorParam("CityName", o => o.MapFrom(s => s.City != null ? s.City.Name : null));
    }
}
