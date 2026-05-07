import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transforms markdown string into safe HTML
   * @param value Markdown string
   * @returns SafeHtml
   */
  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    // marked.parse is synchronous by default unless options.async is true
    // We cast to string because we are not using async options
    const html = marked.parse(value) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
