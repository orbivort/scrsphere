import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DragDropIndicator } from './DragDropIndicator';

// Mock CSS module
vi.mock('./DragDropIndicator.module.css', () => ({
  default: {
    'grabbed-indicator': 'grabbed-indicator',
    'drop-target-indicator': 'drop-target-indicator',
    'moving-indicator': 'moving-indicator',
    visible: 'visible',
    hidden: 'hidden',
  },
}));

describe('DragDropIndicator Component', () => {
  describe('Grabbed State', () => {
    it('should render children when visible', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Test content</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.getByTestId('drag-drop-grabbed')).toBeInTheDocument();
    });

    it('should apply visible class when visible is true', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-grabbed');
      expect(indicator).toHaveClass('grabbed-indicator');
      expect(indicator).toHaveClass('visible');
    });

    it('should apply hidden class when visible is false', () => {
      render(
        <DragDropIndicator type="grabbed" visible={false}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-grabbed');
      expect(indicator).toHaveClass('grabbed-indicator');
      expect(indicator).toHaveClass('hidden');
    });

    it('should have aria-hidden set to true', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-grabbed');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have role="presentation"', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-grabbed');
      expect(indicator).toHaveAttribute('role', 'presentation');
    });
  });

  describe('Drop Target State', () => {
    it('should render children when visible', () => {
      render(
        <DragDropIndicator type="drop-target" visible={true}>
          <div>Drop zone</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Drop zone')).toBeInTheDocument();
      expect(screen.getByTestId('drag-drop-drop-target')).toBeInTheDocument();
    });

    it('should apply correct classes for drop-target type', () => {
      render(
        <DragDropIndicator type="drop-target" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-drop-target');
      expect(indicator).toHaveClass('drop-target-indicator');
      expect(indicator).toHaveClass('visible');
    });

    it('should apply hidden class when not visible', () => {
      render(
        <DragDropIndicator type="drop-target" visible={false}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-drop-target');
      expect(indicator).toHaveClass('hidden');
    });

    it('should have aria-hidden set to true', () => {
      render(
        <DragDropIndicator type="drop-target" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-drop-target');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Moving State', () => {
    it('should render moving indicator with position', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 100, y: 200 }}>
          <div>Moving content</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Moving content')).toBeInTheDocument();
      expect(screen.getByTestId('drag-drop-moving')).toBeInTheDocument();
    });

    it('should apply transform style based on position', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 150, y: 250 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator.style.transform).toBe('translate(150px, 250px)');
    });

    it('should not render when visible is false', () => {
      render(
        <DragDropIndicator type="moving" visible={false} position={{ x: 100, y: 200 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.queryByTestId('drag-drop-moving')).not.toBeInTheDocument();
    });

    it('should not render when position is undefined', () => {
      render(
        <DragDropIndicator type="moving" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.queryByTestId('drag-drop-moving')).not.toBeInTheDocument();
    });

    it('should have aria-hidden set to true', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 100, y: 200 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have role="presentation"', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 100, y: 200 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator).toHaveAttribute('role', 'presentation');
    });
  });

  describe('Label Prop', () => {
    it('should render label for grabbed state', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true} label="Item grabbed">
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Item grabbed')).toBeInTheDocument();
      expect(screen.getByText('Item grabbed')).toHaveClass('sr-only');
    });

    it('should render label for drop-target state', () => {
      render(
        <DragDropIndicator type="drop-target" visible={true} label="Drop target active">
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Drop target active')).toBeInTheDocument();
    });

    it('should render label for moving state', () => {
      render(
        <DragDropIndicator
          type="moving"
          visible={true}
          position={{ x: 100, y: 200 }}
          label="Moving item"
        >
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByText('Moving item')).toBeInTheDocument();
    });

    it('should not render label element when label is not provided', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-grabbed');
      expect(indicator.querySelector('.sr-only')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on all indicator types', () => {
      const { rerender } = render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-grabbed')).toHaveAttribute('aria-hidden', 'true');

      rerender(
        <DragDropIndicator type="drop-target" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-drop-target')).toHaveAttribute('aria-hidden', 'true');

      rerender(
        <DragDropIndicator type="moving" visible={true} position={{ x: 0, y: 0 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-moving')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have presentation role on all indicator types', () => {
      const { rerender } = render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-grabbed')).toHaveAttribute('role', 'presentation');

      rerender(
        <DragDropIndicator type="drop-target" visible={true}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-drop-target')).toHaveAttribute('role', 'presentation');

      rerender(
        <DragDropIndicator type="moving" visible={true} position={{ x: 0, y: 0 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('drag-drop-moving')).toHaveAttribute('role', 'presentation');
    });
  });

  describe('Children Rendering', () => {
    it('should render complex children for grabbed state', () => {
      render(
        <DragDropIndicator type="grabbed" visible={true}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render complex children for drop-target state', () => {
      render(
        <DragDropIndicator type="drop-target" visible={true}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render complex children for moving state', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 0, y: 0 }}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DragDropIndicator>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render without children', () => {
      render(<DragDropIndicator type="grabbed" visible={true} />);

      expect(screen.getByTestId('drag-drop-grabbed')).toBeInTheDocument();
      expect(screen.getByTestId('drag-drop-grabbed').children.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero position values', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 0, y: 0 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator.style.transform).toBe('translate(0px, 0px)');
    });

    it('should handle negative position values', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: -50, y: -100 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator.style.transform).toBe('translate(-50px, -100px)');
    });

    it('should handle large position values', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 9999, y: 9999 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator.style.transform).toBe('translate(9999px, 9999px)');
    });

    it('should handle decimal position values', () => {
      render(
        <DragDropIndicator type="moving" visible={true} position={{ x: 10.5, y: 20.75 }}>
          <div>Content</div>
        </DragDropIndicator>
      );

      const indicator = screen.getByTestId('drag-drop-moving');
      expect(indicator.style.transform).toBe('translate(10.5px, 20.75px)');
    });
  });
});
