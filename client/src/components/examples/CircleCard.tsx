import { CircleCard } from '../CircleCard'
import coverImage from '@assets/stock_images/tech_community_codin_056fa929.jpg'

export default function CircleCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <CircleCard
        id="1"
        name="Tech Innovators"
        description="A community for developers and tech enthusiasts to share ideas and collaborate on projects"
        coverImage={coverImage}
        memberCount={1250}
        isPrivate={false}
        category="Technology"
        onClick={() => console.log('Circle clicked')}
      />
    </div>
  )
}
