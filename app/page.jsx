import App from '../src/App';
import defaults from '../shared/siteContentDefaults.json';
import siteContentStore from '../server/siteContentStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let siteContent = defaults;

  try {
    const currentContent = await siteContentStore.getPublicSiteContent();
    siteContent = { ...defaults, ...currentContent };
  } catch (error) {
    console.error('Unable to render the latest website content:', error.message);
  }

  return <App initialSiteContent={siteContent} />;
}
