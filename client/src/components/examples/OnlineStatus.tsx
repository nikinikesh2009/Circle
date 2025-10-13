import { OnlineStatus } from '../OnlineStatus'

export default function OnlineStatusExample() {
  return (
    <div className="flex gap-4 items-center p-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <OnlineStatus status="online" />
      </div>
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <OnlineStatus status="away" />
      </div>
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <OnlineStatus status="busy" />
      </div>
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-muted" />
        <OnlineStatus status="offline" />
      </div>
    </div>
  )
}
