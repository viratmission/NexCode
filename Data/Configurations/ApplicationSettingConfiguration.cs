using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class ApplicationSettingConfiguration : IEntityTypeConfiguration<ApplicationSetting>
    {
        public void Configure(EntityTypeBuilder<ApplicationSetting> builder)
        {
            builder.ToTable("ApplicationSettings");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.ApplicationName).IsRequired().HasMaxLength(150);
            builder.Property(x => x.DefaultPageSize).IsRequired();
            builder.Property(x => x.MaintenanceMessage).IsRequired().HasMaxLength(500);
            builder.Property(x => x.UpdatedAt).IsRequired();
        }
    }
}
