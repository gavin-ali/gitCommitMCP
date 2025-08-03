public class RedBlackTree<E> {
    private static class RBNode<E> {
        static final int RED = 0;
        static final int BLACK = 1;
        int color = RED;
        E element;
        RBNode<E> left;
        RBNode<E> right;
        RBNode<E> parent;

        RBNode(E element, RBNode<E> parent) {
            this.element = element;
            this.parent = parent;
        }
    }

    private RBNode<E> root;
    private int size;

    public void add(E element) {
        if (element == null)
            throw new IllegalArgumentException("element must not be null");
        if (root == null) {
            root = new RBNode<>(element, null);
            root.color = RBNode.BLACK;
            size++;
            return;
        }

        RBNode<E> node = root;
        RBNode<E> parent;
        int cmp;
        do {
            parent = node;
            cmp = ((Comparable<E>) element).compareTo(node.element);
            if (cmp < 0) {
                node = node.left;
            } else if (cmp > 0) {
                node = node.right;
            } else {
                node.element = element;
                return;
            }
        } while (node != null);

        RBNode<E> newNode = new RBNode<>(element, parent);
        if (cmp < 0) {
            parent.left = newNode;
        } else {
            parent.right = newNode;
        }
        fixAfterInsertion(newNode);
        size++;
    }

    private void fixAfterInsertion(RBNode<E> node) {
        node.color = RBNode.RED;
        while (node != null && node != root && node.parent.color == RBNode.RED) {
            if (parentOf(node) == leftOf(parentOf(parentOf(node)))) {
                RBNode<E> uncle = rightOf(parentOf(parentOf(node)));
                if (colorOf(uncle) == RBNode.RED) {
                    setColor(parentOf(node), RBNode.BLACK);
                    setColor(uncle, RBNode.BLACK);
                    setColor(parentOf(parentOf(node)), RBNode.RED);
                    node = parentOf(parentOf(node));
                } else {
                    if (node == rightOf(parentOf(node))) {
                        node = parentOf(node);
                        rotateLeft(node);
                    }
                    setColor(parentOf(node), RBNode.BLACK);
                    setColor(parentOf(parentOf(node)), RBNode.RED);
                    rotateRight(parentOf(parentOf(node)));
                }
            } else {
                RBNode<E> uncle = leftOf(parentOf(parentOf(node)));
                if (colorOf(uncle) == RBNode.RED) {
                    setColor(parentOf(node), RBNode.BLACK);
                    setColor(uncle, RBNode.BLACK);
                    setColor(parentOf(parentOf(node)), RBNode.RED);
                    node = parentOf(parentOf(node));
                } else {
                    if (node == leftOf(parentOf(node))) {
                        node = parentOf(node);
                        rotateRight(node);
                    }
                    setColor(parentOf(node), RBNode.BLACK);
                    setColor(parentOf(parentOf(node)), RBNode.RED);
                    rotateLeft(parentOf(parentOf(node)));
                }
            }
        }
        root.color = RBNode.BLACK;
    }

    private void rotateLeft(RBNode<E> p) {
        if (p != null) {
            RBNode<E> r = p.right;
            p.right = r.left;
            if (r.left != null)
                r.left.parent = p;
            r.parent = p.parent;
            if (p.parent == null)
                root = r;
            else if (p.parent.left == p)
                p.parent.left = r;
            else
                p.parent.right = r;
            r.left = p;
            p.parent = r;
        }
    }

    private void rotateRight(RBNode<E> p) {
        if (p != null) {
            RBNode<E> l = p.left;
            p.left = l.right;
            if (l.right != null)
                l.right.parent = p;
            l.parent = p.parent;
            if (p.parent == null)
                root = l;
            else if (p.parent.right == p)
                p.parent.right = l;
            else
                p.parent.left = l;
            l.right = p;
            p.parent = l;
        }
    }

    private static <E> RBNode<E> parentOf(RBNode<E> n) {
        return (n == null ? null : n.parent);
    }

    private static <E> RBNode<E> leftOf(RBNode<E> n) {
        return (n == null) ? null : n.left;
    }

    private static <E> RBNode<E> rightOf(RBNode<E> n) {
        return (n == null) ? null : n.right;
    }

    private static <E> int colorOf(RBNode<E> n) {
        return (n == null ? RBNode.BLACK : n.color);
    }

    private static <E> void setColor(RBNode<E> n, int c) {
        if (n != null)
            n.color = c;
    }
}