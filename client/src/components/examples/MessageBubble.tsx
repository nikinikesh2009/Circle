import { MessageBubble } from '../MessageBubble'

export default function MessageBubbleExample() {
  return (
    <div className="p-4 max-w-2xl">
      <MessageBubble
        content="Hey! Did you see the new React 19 features?"
        sender={{ name: "Sarah", fallback: "SA" }}
        timestamp="10:30 AM"
        isSent={false}
      />
      <MessageBubble
        content="Yes! The new compiler looks amazing. Can't wait to try it out!"
        sender={{ name: "You", fallback: "ME" }}
        timestamp="10:32 AM"
        isSent={true}
      />
      <MessageBubble
        content="I can help you get started with React 19. Would you like a quick overview of the key features?"
        sender={{ name: "AI Assistant", fallback: "AI" }}
        timestamp="10:33 AM"
        isSent={false}
        isAI={true}
      />
    </div>
  )
}
