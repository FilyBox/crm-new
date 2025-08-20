import React from 'react';

import { format } from 'date-fns';
import { User, Users } from 'lucide-react';

import { cn } from '../../lib/utils';
import type { LpmData } from '../../types/tables-types';

const Field: React.FC<{
  label: string;
  value: string | number | boolean | Date | undefined;
}> = ({ label, value }) => {
  let displayValue: string = '';

  if (value instanceof Date && !isNaN(value.getTime())) {
    displayValue = format(value, 'yyyy-MM-dd HH:mm');
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value !== undefined && value !== null) {
    displayValue = String(value);
  }

  return (
    <div className="flex flex-wrap justify-between">
      <div className="text-md font-semibold">{label}:</div>
      <div className={cn('text-sm')}>{displayValue || '-'}</div>
    </div>
  );
};

// Main component
const LpmMobileDetails: React.FC<{
  data: LpmData;
}> = ({ data }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg">Product Information</h2>

        {data.productDisplayArtist && data.productDisplayArtist.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center text-sm font-medium">
              <Users className="mr-2 h-4 w-4" />
              Artistas
            </h4>
            {data.productDisplayArtist.map((artist, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center">
                  <User className="text-accent-foreground mr-2 h-4 w-4" />
                  <p>{artist.artistName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Field label="Product ID" value={data.productId} />
        <Field label="Product Type" value={data.productType} />
        <Field label="Product Title" value={data.productTitle} />
        <Field label="Product Version" value={data.productVersion} />
        <Field label="Parent Label" value={data.parentLabel} />
        <Field label="Label" value={data.label} />
        <Field label="Original Release Date" value={data.originalReleaseDate} />
        <Field label="Release Date" value={data.releaseDate} />
        <Field label="UPC" value={data.upc} />
        <Field label="Catalog" value={data.catalog} />
        <Field label="Product Price Tier" value={data.productPriceTier} />
        <Field label="Product Genre" value={data.productGenre} />
        <Field label="Submission Status" value={data.submissionStatus} />
        <Field label="Product C Line" value={data.productCLine} />
        <Field label="Product P Line" value={data.productPLine} />
        <Field label="Pre-Order Date" value={data.preOrderDate} />
        <Field label="Exclusives" value={data.exclusives} />
        <Field label="Explicit Lyrics" value={data.explicitLyrics} />
        <Field label="Product Play Link" value={data.productPlayLink} />
        <Field label="Liner Notes" value={data.linerNotes} />
        <Field label="Primary Metadata Language" value={data.primaryMetadataLanguage} />
        <Field label="Compilation" value={data.compilation} />
        <Field label="PDF Booklet" value={data.pdfBooklet} />
        <Field label="Timed Release Date" value={data.timedReleaseDate} />
        <Field label="Timed Release Music Services" value={data.timedReleaseMusicServices} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg">Track Information</h2>
        <Field label="Track Type" value={data.trackType} />
        <Field label="Track ID" value={data.trackId} />
        <Field label="Track Volume" value={data.trackVolume} />
        <Field label="Track Number" value={data.trackNumber} />
        <Field label="Track Name" value={data.trackName} />
        <Field label="Track Version" value={data.trackVersion} />
        <Field label="Track Display Artist" value={data.trackDisplayArtist} />
        <Field label="ISRC" value={data.isrc} />
        <Field label="Track Price Tier" value={data.trackPriceTier} />
        <Field label="Track Genre" value={data.trackGenre} />
        <Field label="Audio Language" value={data.audioLanguage} />
        <Field label="Track C Line" value={data.trackCLine} />
        <Field label="Track P Line" value={data.trackPLine} />
        <Field label="Writers/Composers" value={data.writersComposers} />
        <Field label="Publishers Collection Societies" value={data.publishersCollectionSocieties} />
        <Field label="Withhold Mechanicals" value={data.withholdMechanicals} />
        <Field label="Pre-Order Type" value={data.preOrderType} />
        <Field label="Instant Gratification Date" value={data.instantGratificationDate} />
        <Field label="Duration" value={data.duration} />
        <Field label="Sample Start Time" value={data.sampleStartTime} />
        <Field label="Explicit Lyrics (Track)" value={data.explicitLyricsTrack} />
        <Field label="Album Only" value={data.albumOnly} />
        <Field
          label="Additional Contributors (Performing)"
          value={data.additionalContributorsPerforming}
        />
        <Field
          label="Additional Contributors (Non-Performing)"
          value={data.additionalContributorsNonPerforming}
        />
        <Field label="Producers" value={data.producers} />
        <Field label="Continuous Mix" value={data.continuousMix} />
        <Field
          label="Continuously Mixed Individual Song"
          value={data.continuouslyMixedIndividualSong}
        />
        <Field label="Track Play Link" value={data.trackPlayLink} />
        <Field label="Lyrics" value={data.lyrics} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg">Metadata</h2>
        <Field label="Last Process Date" value={data.lastProcessDate} />
        <Field label="Import Date" value={data.importDate} />
        <Field label="Created By" value={data.createdBy} />
        <Field label="Last Modified" value={data.lastModified} />
        <Field label="Submitted At" value={data.submittedAt} />
        <Field label="Submitted By" value={data.submittedBy} />
        <Field label="Vevo Channel" value={data.vevoChannel} />
      </div>
    </div>
  );
};

export default LpmMobileDetails;
