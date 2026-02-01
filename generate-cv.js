const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const ejs = require('ejs');

// A more robust parsing function
function parseMarkdown(markdown) {
    const data = {
        name: '',
        title: '',
        about: '',
        contacts: {},
        skills: [],
        experience: [],
        education: [],
        languages: []
    };

    // Split the markdown into sections by '##' headers
    const sections = markdown.split(/\n(?=##\s)/g);

    sections.forEach(section => {
        const headerMatch = section.match(/^##\s(.*?)\n/);
        const header = headerMatch ? headerMatch[1].trim().toLowerCase() : 'header';
        const content = headerMatch ? section.substring(headerMatch[0].length).trim() : section;

        if (header === 'header') {
            const lines = content.split('\n').filter(l => l.trim());
            data.name = (lines[0] || '').replace('#', '').trim();
            data.title = lines[1] || '';
        } else if (header.includes('contact') || header.includes('контакты')) {
            content.split('\n').forEach(line => {
                const urlMatch = line.match(/\((.*?)\)/);
                const emailMatch = line.match(/<(.*?)>/);

                if (urlMatch) {
                    const url = urlMatch[1];
                    if (line.includes('linkedin.com')) data.contacts.linkedin = url;
                    else if (line.includes('github.com')) data.contacts.github = url;
                    else if (line.includes('t.me')) data.contacts.telegram = url;
                    else if (line.includes('wa.me')) data.contacts.whatsapp = url;
                    else if (line.includes('tel:')) data.contacts.phone = url;
                } else if (emailMatch) {
                    data.contacts.email = emailMatch[1];
                }
                
                if (/Location:|Локация:/.test(line)) {
                    data.contacts.location = (line.split(/:(.+)/)[1] || '').replace(/\*/g, '').trim();
                }
            });
            if (data.contacts.github) {
                data.avatarUrl = `https://github.com/${data.contacts.github.split('/').pop()}.png`;
            }
        } else if (header.includes('about') || header.includes('о себе')) {
            data.about = marked.parse(content);
        } else if (header.includes('skills') || header.includes('навыки')) {
            const skillBlocks = content.split(/-\s\*\*/g).filter(s => s.trim());
            data.skills = skillBlocks.map(block => {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                const category = (lines[0] || '').replace(/\*:/, '').trim();
                const items = lines.slice(1).map(item => item.replace(/^-/, '').trim());
                return { category, items };
            });
        } else if (header.includes('experience') || header.includes('опыт работы')) {
            const jobs = content.split(/(?=###\s)/g).filter(j => j.trim().startsWith('###'));
            data.experience = jobs.map(job => {
                const jobLines = job.trim().split('\n');
                const [title, company] = (jobLines[0] || '').replace('### ', '').split(' — ');
                const date = jobLines[1] ? jobLines[1].replace(/\*/g, '').trim() : '';
                const description = marked.parse(jobLines.slice(2).join('\n'));
                return {
                    title: title ? title.trim() : '',
                    company: company ? company.split(',')[0].trim() : '',
                    date: date,
                    description: description
                };
            });
        } else if (header.includes('education') || header.includes('образование')) {
            const eduBlocks = content.split(/-\s/g).filter(b => b.trim());
            data.education = eduBlocks.map(block => {
                const lines = block.trim().split('\n');
                const degreeLine = (lines[0] || '').replace(/\*\*/g, '').trim();
                const schoolLine = (lines[1] || '').trim();
                return {
                    degree: degreeLine,
                    school: schoolLine.split(',')[0].trim(),
                    faculty: schoolLine.split(',')[1] ? schoolLine.split(',')[1].trim() : ''
                };
            });
        } else if (header.includes('languages') || header.includes('владение языками')) {
            data.languages = content.split('\n-').filter(Boolean).map(line => line.replace(/^-|\*/g, "").trim());
        }
    });

    return data;
}

async function main() {
    try {
        const outputDir = path.join(__dirname, 'dist');
        const assetsSourceDir = path.join(__dirname, 'assets');
        const assetsDestDir = path.join(outputDir, 'assets');

        // Setup output directory
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.mkdir(outputDir, { recursive: true });

        // Copy assets
        await fs.cp(assetsSourceDir, assetsDestDir, { recursive: true });
        console.log('Assets copied to dist/assets');

        // Find all .md files except README
        const allFiles = await fs.readdir(__dirname);
        const mdFiles = allFiles.filter(file => file.endsWith('.md') && file.toLowerCase() !== 'readme.md' && !file.toLowerCase().startsWith('gemini'));
        
        const template = await fs.readFile('template.ejs', 'utf-8');

        // Process each markdown file
        for (const inputFile of mdFiles) {
            const markdown = await fs.readFile(inputFile, 'utf-8');
            const data = parseMarkdown(markdown);
            
            // --- Determine Avatar URL ---
            const localAvatarPath = 'assets/images/avatar.png';
            try {
                await fs.access(path.join(__dirname, localAvatarPath));
                data.avatarUrl = localAvatarPath;
            } catch {
                if (data.contacts && data.contacts.github) {
                    data.avatarUrl = `https://github.com/${data.contacts.github.split('/').pop()}.png`;
                }
            }
            
            const html = ejs.render(template, { ...data, filename: 'template.ejs' });
            
            const outputFile = path.join(outputDir, `${path.basename(inputFile, '.md')}.html`);
            await fs.writeFile(outputFile, html);
            console.log(`Successfully generated CV at ${outputFile}`);
        }

    } catch (error) {
        console.error('Error during CV generation:', error);
    }
}

main();