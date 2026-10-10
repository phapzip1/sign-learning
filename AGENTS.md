# AGENTS.md

## Project Overview

This repository is a monorepo containing three independently organized components of a machine-learning web application.

- `ui/`: React frontend.
- `service/`: ASP.NET Core backend API for the frontend.
- `inference/`: FastAPI service responsible for loading and running TensorFlow Lite (TFLite) model inference.

Each component has its own dependencies, configuration, tests, and development workflow.

## Architecture

The intended request flow is:

1. The React frontend sends application requests to the ASP.NET Core API.
2. The ASP.NET Core API handles application logic, validation, and authorization.
3. When a prediction is required, the ASP.NET Core API calls the FastAPI inference service.
4. The inference service preprocesses the input, executes the TFLite model, and returns the prediction.
5. The ASP.NET Core API returns an appropriate response to the frontend.

Follow the existing implementation if the actual request flow differs. Do not change service communication boundaries without a clear requirement.

## Workspace Responsibilities

### `ui/`

Responsible for:
- User interface and client-side interactions.
- React components, pages, and state management.
- Calling the ASP.NET Core API.
- Presenting loading, success, and error states.

Must not:
- Load or execute the TFLite model directly.
- Contain backend secrets or inference-service credentials.
- Hardcode environment-specific API URLs.

### `service/`

Responsible for:
- Application API endpoints and business logic.
- Request validation, authentication, and authorization.
- Application data access, where applicable.
- Communication with the inference service.
- Translating upstream errors into appropriate API responses.

Must not:
- Duplicate model inference logic.
- Hardcode service URLs, credentials, or environment-specific settings.
- Expose internal inference implementation details unnecessarily.

### `inference/`

Responsible for:
- FastAPI endpoints for inference.
- Loading and managing the TFLite model.
- Input validation, preprocessing, inference, and postprocessing.
- Inference-specific health checks and error handling.

Must not:
- Implement frontend behavior or application business logic.
- Load the model from disk on every prediction request unless explicitly required.
- Expose internal stack traces or sensitive inputs in API responses or logs.

## Cross-Service Contracts

- Treat API request and response schemas as explicit contracts.
- Keep the React frontend, ASP.NET Core API, and FastAPI service consistent when a shared contract changes.
- Validate inputs at service boundaries.
- Use appropriate HTTP status codes and predictable error-response formats.
- Handle inference timeouts, unavailable services, and invalid predictions gracefully.
- Update relevant API documentation and tests whenever a contract changes.
- Avoid breaking existing contracts unless the task explicitly requires it.

## General Development Rules

- Read this file and the relevant workspace-level `AGENTS.md` before making changes.
- Inspect existing code, configuration, dependency manifests, and tests before proposing a solution.
- Follow existing architecture, naming conventions, formatting, and dependency choices.
- Make the smallest coherent change that solves the task.
- Do not modify unrelated workspaces or refactor unrelated code.
- Do not introduce a new dependency or framework without a clear reason.
- Do not overwrite existing user changes.
- Never commit secrets, credentials, local environment files, or private model data.
- Do not invent file paths, commands, API endpoints, or configuration values. Verify them in the repository first.

## Configuration and Security

- Keep environment-specific settings in the appropriate configuration or environment variables.
- Use example configuration files without real secrets.
- Do not log credentials, authorization tokens, or sensitive input data.
- Keep internal service endpoints private where possible.
- Validate external and inter-service inputs.
- Apply appropriate timeouts and error handling to network calls.
- Do not weaken existing authentication, authorization, or security controls to make tests pass.

## Testing and Validation

Before finishing a task:

1. Identify which workspace and interfaces are affected.
2. Run relevant existing tests and checks for the changed workspace.
3. Run tests for other workspaces when shared contracts or integration behavior change.
4. Run available build, lint, type-checking, or formatting checks where appropriate.
5. Report the checks that passed, failed, or could not be run.

Use the commands and conventions documented in the relevant workspace. Do not assume a command exists without verifying it.

## Documentation

- Update `docs/architecture.md` when service boundaries or important integration flows change.
- Document configuration changes and new environment variables.
- Keep API contracts, setup instructions, and development commands accurate.
- Prefer concise, maintained documentation over duplicating large amounts of information in this file.

## Completion Summary

When finishing a task, summarize:

- What changed and why.
- Which workspaces were affected.
- Tests and validation commands executed, including their results.
- Any remaining limitations, assumptions, or follow-up work.