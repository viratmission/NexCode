using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class CvDocumentConfiguration : IEntityTypeConfiguration<CvDocument>
    {
        public void Configure(EntityTypeBuilder<CvDocument> builder)
        {
            builder.ToTable("CvDocuments");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(260);
            builder.Property(x => x.StoredFileName).IsRequired().HasMaxLength(260);
            builder.Property(x => x.RelativeFilePath).IsRequired().HasMaxLength(500);
            builder.Property(x => x.ContentType).IsRequired().HasMaxLength(150);
            builder.Property(x => x.FileSize).IsRequired();
            builder.Property(x => x.UploadedAt).IsRequired();

            builder.HasIndex(x => x.JobSeekerId).IsUnique();
        }
    }
}
