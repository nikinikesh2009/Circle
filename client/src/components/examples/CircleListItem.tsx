import { CircleListItem } from '../CircleListItem'

export default function CircleListItemExample() {
  return (
    <div className="p-4 max-w-sm space-y-2">
      <CircleListItem
        id="1"
        name="Tech Innovators"
        lastMessage="Sarah: The new React features are amazing!"
        timestamp="2m ago"
        unreadCount={5}
        onClick={() => console.log('Circle clicked')}
      />
      <CircleListItem
        id="2"
        name="Fitness Squad"
        lastMessage="Mike: Anyone up for a morning run?"
        timestamp="1h ago"
        isActive={true}
        onClick={() => console.log('Circle clicked')}
      />
      <CircleListItem
        id="3"
        name="Book Club"
        lastMessage="Emma: Just finished chapter 5, thoughts?"
        timestamp="3h ago"
        onClick={() => console.log('Circle clicked')}
      />
    </div>
  )
}
