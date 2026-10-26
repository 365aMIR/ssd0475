import React from 'react';

// Above the list of Inschrijvingen: download the whole mailing list as a CSV
// (the export endpoint in collections/Subscribers.ts).
const SubscribersExport: React.FC = () => {
    return (
        <div style={{ marginBottom: 'calc(var(--base) * 1)' }}>
            <a
                className="btn btn--style-secondary btn--size-small"
                href="/api/subscribers/export"
                download
            >
                Download als CSV
            </a>
        </div>
    );
};

export default SubscribersExport;
