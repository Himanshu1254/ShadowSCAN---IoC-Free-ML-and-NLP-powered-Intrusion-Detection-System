import os
import sys

def generate_pdf():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
    except ImportError:
        print("Please install reportlab: pip install reportlab")
        sys.exit(1)

    doc = SimpleDocTemplate("ShadowSCAN_Context.pdf", pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Exclude directories that are large or unnecessary
    exclude_dirs = {'.git', 'venv', 'node_modules', '__pycache__', '.pytest_cache', 'models', 'Data', 'dist', 'build', '.vscode', '.idea'}
    
    # Extensions to include
    include_exts = {'.py', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.json', '.txt', '.sh', '.bat'}
    include_files = {'Dockerfile', 'Makefile', '.env.example', 'pyproject.toml', 'requirements.txt'}

    project_root = r"d:\Projects\ShadowSCAN"
    
    story.append(Paragraph("Project Folder Structure", styles['Heading1']))
    
    # Generate tree structure
    tree_lines = []
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        level = root.replace(project_root, '').count(os.sep)
        indent = ' ' * 4 * level
        tree_lines.append(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            tree_lines.append(f"{subindent}{f}")
            
    tree_text = "\n".join(tree_lines)
    
    # Custom style for code to make font smaller
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontSize=7,
        leading=8,
    )
    
    story.append(Preformatted(tree_text, code_style))
    story.append(PageBreak())
    
    story.append(Paragraph("Code Files Content", styles['Heading1']))
    
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in include_exts or file in include_files:
                filepath = os.path.join(root, file)
                # Avoid very large files like package-lock.json
                if 'package-lock.json' in file:
                    continue
                try:
                    if os.path.getsize(filepath) > 100000: # skip files > 100KB
                        continue
                        
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Split very long lines to avoid them going off the page
                    max_len = 110
                    lines = content.split('\n')
                    wrapped_lines = []
                    for line in lines:
                        # expand tabs
                        line = line.replace('\t', '    ')
                        while len(line) > max_len:
                            wrapped_lines.append(line[:max_len])
                            line = "    " + line[max_len:] # indent wrapped part
                        wrapped_lines.append(line)
                    content = '\n'.join(wrapped_lines)
                    
                    rel_path = os.path.relpath(filepath, project_root)
                    story.append(Paragraph(f"File: {rel_path}", styles['Heading2']))
                    story.append(Preformatted(content, code_style))
                    story.append(Spacer(1, 0.1 * inch))
                except Exception as e:
                    story.append(Paragraph(f"Could not read {file}: {e}", styles['Normal']))
                    story.append(Spacer(1, 0.1 * inch))

    print("Building PDF...")
    doc.build(story)
    print("PDF generated successfully: ShadowSCAN_Context.pdf")

if __name__ == "__main__":
    generate_pdf()
