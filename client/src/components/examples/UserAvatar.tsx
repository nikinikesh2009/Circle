import { UserAvatar } from '../UserAvatar'

export default function UserAvatarExample() {
  return (
    <div className="flex gap-4 items-center p-4">
      <UserAvatar fallback="JD" alt="John Doe" status="online" size="sm" />
      <UserAvatar fallback="SA" alt="Sarah Anderson" status="away" size="md" />
      <UserAvatar fallback="MK" alt="Mike Kim" status="busy" size="lg" />
    </div>
  )
}
