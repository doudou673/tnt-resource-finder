flowchart TD
    A[Landing Page] --> B[Sign In Sign Up]
    B --> C{Authenticated?}
    C -->|Yes| D[Dashboard]
    C -->|No| B
    D --> E[Search Input]
    E --> F[API Search]
    F --> G[Database]
    G --> F
    F --> H[Display Results]
    D --> I{Admin Role?}
    I -->|Yes| J[Admin Panel]
    I -->|No| D
    J --> K[Manage Resources]
    K --> G
    K --> J