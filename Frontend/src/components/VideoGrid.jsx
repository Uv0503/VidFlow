import VideoCard from "./VideoCard";

export default function VideoGrid({ items = [] }) {
  return <div className="video-grid">{items.map((video) => <VideoCard key={video._id} video={video} />)}</div>;
}
