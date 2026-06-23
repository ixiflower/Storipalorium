#!/usr/bin/env python3
f = open('app/create/page.tsx').read()

# Fix duplicate tags state
lines = f.split('\n')
new_lines = []
seen_tags = False
for l in lines:
    if "const [tags, setTags] = useState('');" in l:
        if not seen_tags:
            new_lines.append(l)
            seen_tags = True
        continue
    new_lines.append(l)
f = '\n'.join(new_lines)

# Add tags to handleSave body
f = f.replace(
    "const body: Record<string, string> = { title: title.trim(), link: link.trim(), category: finalCategory };",
    "const body: Record<string, string> = { title: title.trim(), link: link.trim(), category: finalCategory, tags };"
)

# Add tags input before Link field
f = f.replace(
    '            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Link</label>',
    '            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Tags</label>\n' +
    '            <input value={tags} onChange={(e) => setTags(e.target.value)}\n' +
    '              placeholder="#ui/ux #video #tutorial (comma separated)"\n' +
    '              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14" />\n\n' +
    '            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Link</label>'
)

# Clear tags on save
f = f.replace(
    "setOpen(false); setTitle(''); setLink(''); setCategory('notes'); setCustomCat('');",
    "setOpen(false); setTitle(''); setLink(''); setCategory('notes'); setCustomCat(''); setTags('');"
)

open('app/create/page.tsx', 'w').write(f)
print('Done')
