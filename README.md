# Personal Schedule Builder

A modern, interactive personal schedule management application designed to help you organize your daily tasks and projects efficiently.

## Overview

Personal Schedule Builder is a web-based tool that allows users to create projects, manage sub-tasks, and organize them into a daily schedule using an intuitive drag-and-drop interface. Built with a focus on usability and productivity, it features local persistence and print-friendly layouts.

## Key Features

- **Project Management**: Create multiple projects with customizable names and unique color coding.
- **Task Organization**: Add, edit, and track sub-tasks within each project.
- **Interactive Scheduling**: Drag and drop projects or specific tasks into hourly time slots to build your daily plan.
- **Local Persistence**: Automatically saves your data to local storage, ensuring your schedule is preserved between sessions.
- **Print-Ready**: Optimized CSS for printing your schedule, making it easy to take your plan offline.
- **Data Migration**: Robust handling of data versioning to ensure compatibility across updates.
- **Debug Tools**: Import and export your schedule data for backup or advanced management.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Drag & Drop**: [@dnd-kit](https://dnd-kit.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm (or npm/yarn)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## License

This project is licensed under the MIT License.