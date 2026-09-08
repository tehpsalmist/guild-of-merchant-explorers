import { ChatBubbleLeftRightIcon, MicrophoneIcon } from '@heroicons/react/24/outline'

export const TableTalkIcon = () => (
  <span className="relative block h-8 w-9 shrink-0" aria-hidden="true">
    <ChatBubbleLeftRightIcon className="absolute left-0 top-0 h-6 w-6" />
    <MicrophoneIcon className="absolute bottom-0 right-0 h-5 w-5" />
  </span>
)
