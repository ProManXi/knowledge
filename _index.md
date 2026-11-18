---
type: index
---

# Knowledge Index

## Open Bugs

```dataview
TABLE date, project, feature, severity FROM "" WHERE type = "bug" AND (status = "open" OR status = "in-progress") SORT date DESC
```

## Open Incidents

```dataview
TABLE date, project, feature FROM "" WHERE type = "incident" AND (status = "open" OR status = "investigating" OR status = "mitigated") SORT date DESC
```

## Open Tickets

```dataview
TABLE date, project, feature, customer FROM "" WHERE type = "ticket" AND (status = "open" OR status = "in-progress") SORT date DESC
```

## Recent Sessions

```dataview
TABLE date, project, feature, author FROM "" WHERE type = "session" SORT date DESC LIMIT 10
```

---

## Projects

- [[my-loop]]
- [[volvo-digital-twin]]
