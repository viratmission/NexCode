using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class ContactRequestConfiguration : IEntityTypeConfiguration<ContactRequest>
    {
        public void Configure(EntityTypeBuilder<ContactRequest> builder)
        {
            builder.ToTable("ContactRequests");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
            builder.Property(x => x.CreatedAt).IsRequired();

            builder.HasIndex(x => new { x.EmployerId, x.JobSeekerId, x.VacancyId, x.Status });

            builder.HasOne(x => x.Employer)
                .WithMany(x => x.ContactRequestsAsEmployer)
                .HasForeignKey(x => x.EmployerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.JobSeeker)
                .WithMany(x => x.ContactRequestsAsJobSeeker)
                .HasForeignKey(x => x.JobSeekerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Vacancy)
                .WithMany(x => x.ContactRequests)
                .HasForeignKey(x => x.VacancyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
