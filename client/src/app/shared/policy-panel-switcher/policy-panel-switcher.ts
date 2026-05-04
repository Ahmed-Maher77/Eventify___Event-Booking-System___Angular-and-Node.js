import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, signal, computed } from '@angular/core';

export interface PolicyPanelItem {
  key: string;
  navLabel: string;
  iconClass: string;
  kicker: string;
  title: string;
  description: string;
  points: string[];
}

@Component({
  selector: 'app-policy-panel-switcher',
  standalone: true,
  templateUrl: './policy-panel-switcher.html',
  styleUrl: './policy-panel-switcher.scss'
})
export class PolicyPanelSwitcherComponent implements OnChanges {
  @Input({ required: true }) panels: readonly PolicyPanelItem[] = [];
  @Input() ariaLabel = 'Policy sections';
  @ViewChild('policyPanelCard') private policyPanelCard?: ElementRef<HTMLElement>;
  private readonly activePanelKey = signal('');

  protected readonly activePanel = computed(
    () => this.panels.find((panel) => panel.key === this.activePanelKey()) ?? this.panels[0]
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['panels'] && this.panels.length > 0 && !this.activePanelKey()) {
      this.activePanelKey.set(this.panels[0].key);
    }
  }

  protected isActive(panelKey: string): boolean {
    return this.activePanelKey() === panelKey;
  }

  protected selectPanel(panelKey: string): void {
    if (this.activePanelKey() === panelKey) {
      return;
    }

    this.activePanelKey.set(panelKey);
    this.animatePanelSwap();
  }

  private animatePanelSwap(): void {
    const card = this.policyPanelCard?.nativeElement;
    if (!card) {
      return;
    }

    card.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }
    );
  }
}
