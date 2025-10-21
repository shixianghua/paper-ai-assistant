# Copilot Instructions for Paper AI Assistant

## Project Overview

This is an intelligent paper generation and plagiarism reduction platform (智能论文生成与降重平台). The platform uses AI to help with academic paper writing and content optimization.

## Language Support

- The project supports both Chinese and English
- Code comments can be in English
- User-facing content and documentation should support Chinese
- Variable and function names should use English for consistency

## Development Guidelines

### Code Style

- Use clear, descriptive variable and function names
- Follow consistent naming conventions (camelCase for JavaScript/TypeScript, snake_case for Python)
- Write self-documenting code where possible
- Add comments for complex logic or algorithms

### Project Structure

- Keep the project organized with clear separation of concerns
- Group related functionality into modules or packages
- Use meaningful directory names

### Best Practices

- Write modular, reusable code
- Handle errors gracefully with appropriate error messages
- Validate user input thoroughly
- Consider security implications, especially for user-generated content
- Optimize for performance when processing large documents

### Testing

- Write unit tests for core functionality
- Test edge cases and error conditions
- Ensure tests are maintainable and well-documented

### Documentation

- Keep README.md up to date with setup and usage instructions
- Document API endpoints and their parameters
- Include examples for complex features
- Maintain a changelog for significant updates

## AI/ML Considerations

- When working with AI models, consider token limits and costs
- Implement proper rate limiting for API calls
- Cache results where appropriate to improve performance
- Handle API failures gracefully with retries and fallbacks

## Security

- Never commit API keys or secrets to the repository
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Be cautious with file uploads and processing

## Academic Integrity

While this platform assists with paper writing, ensure that:
- The tool promotes ethical use of AI in academic writing
- Users understand the importance of original work
- Features comply with academic integrity standards
