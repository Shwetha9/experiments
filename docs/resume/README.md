# Resume content

The `/resume` page, downloadable PDF and editable Markdown use
`libs/editorial-content/src/lib/resume-content.json` as their content source.

After editing that JSON, regenerate the PDF and Markdown with a Python interpreter
that includes ReportLab:

```sh
python3 tools/generate-resume.py
```

The generator writes to `output/pdf/` and copies the PDF to
`apps/studio/public/files/shwetha-anand-resume.pdf` for the Angular assets build.
Review both rendered PDF pages after changes. Build the Studio application to
validate the Angular page.

## Editorial basis

- Career titles, dates, education, certifications and contact details come from
  the LinkedIn export supplied on 19 November 2026.
- The customer demonstration and requirements / product-gap feedback come from
  Shwetha's account of her FSM customer call on 19 November 2026. No customer
  identity or confidential requirements are included.
- The personal project description is supported by this repository's Angular
  application, NestJS API and provider / safety implementations. It does not
  claim enterprise customer deployment, adoption figures or measured impact.
- Lead Forward Deployed Engineer is the target role. Actual employment titles
  are retained. The overlapping Allegis Group and EnergyAustralia entries are
  presented as one client engagement to avoid double-counting.
- Recent roles whose duties were not described in the export retain their
  verified titles and dates. Quantified outcomes, team scope and additional
  delivery examples can be added when supplied; they are not invented here.

Deployment continues through the repository's existing Vercel setup. The resume
does not introduce a new hosting provider or change the domain configuration.
