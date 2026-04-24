"mobx-route": minor
---

Keep the last route params in `RouteViewModel.payload` after a path route is closed.

This prevents `payload` and `pathParams` from resetting to an empty object when navigation moves to another route, so view models can still access the most recent path params.
