import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/topics/$topicId")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/topics/$topicId"!</div>
}
