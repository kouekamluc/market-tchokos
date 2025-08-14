from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Payment, MobileMoneyTransaction, CashOnDeliveryPayment, PaymentRefund

@receiver(post_save, sender=Payment)
def payment_status_changed(sender, instance, created, **kwargs):
    """Handle payment status changes"""
    if created:
        # New payment created
        print(f"New payment created: {instance.reference_number}")
        # Here you could send notifications, update order status, etc.
    else:
        # Payment updated
        print(f"Payment {instance.reference_number} status changed to: {instance.payment_status}")
        
        # Update order status based on payment status
        if instance.payment_status == 'completed':
            if instance.order:
                instance.order.payment_status = 'paid'
                instance.order.save()
                print(f"Order {instance.order.id} payment status updated to paid")
            elif instance.agri_order:
                instance.agri_order.payment_status = 'paid'
                instance.agri_order.save()
                print(f"AgriOrder {instance.agri_order.id} payment status updated to paid")
        
        elif instance.payment_status == 'failed':
            if instance.order:
                instance.order.payment_status = 'failed'
                instance.order.save()
            elif instance.agri_order:
                instance.agri_order.payment_status = 'failed'
                instance.agri_order.save()

@receiver(post_save, sender=MobileMoneyTransaction)
def mobile_money_transaction_updated(sender, instance, created, **kwargs):
    """Handle mobile money transaction updates"""
    if created:
        print(f"New mobile money transaction created for {instance.provider}")
    else:
        print(f"Mobile money transaction {instance.id} status: {instance.status}")
        
        # Update payment status based on transaction status
        if instance.status == 'success':
            instance.payment.payment_status = 'completed'
            instance.payment.completed_at = timezone.now()
            instance.payment.save()
            print(f"Payment {instance.payment.reference_number} completed via {instance.provider}")
        
        elif instance.status == 'failed':
            instance.payment.payment_status = 'failed'
            instance.payment.save()
            print(f"Payment {instance.payment.reference_number} failed via {instance.provider}")

@receiver(post_save, sender=CashOnDeliveryPayment)
def cod_payment_created(sender, instance, created, **kwargs):
    """Handle cash on delivery payment creation"""
    if created:
        print(f"New COD payment created: {instance.id}")
        
        # Update payment status
        instance.payment.payment_status = 'completed'
        instance.payment.completed_at = timezone.now()
        instance.payment.save()
        
        # Update order status
        if instance.payment.order:
            instance.payment.order.payment_status = 'paid'
            instance.payment.order.save()
        elif instance.payment.agri_order:
            instance.payment.agri_order.payment_status = 'paid'
            instance.payment.agri_order.save()

@receiver(post_save, sender=PaymentRefund)
def refund_status_changed(sender, instance, created, **kwargs):
    """Handle refund status changes"""
    if created:
        print(f"New refund created: {instance.id}")
        
        # Update payment status
        instance.payment.payment_status = 'refunded'
        instance.payment.save()
        
        # Update order status if applicable
        if instance.payment.order:
            instance.payment.order.payment_status = 'refunded'
            instance.payment.order.save()
        elif instance.payment.agri_order:
            instance.payment.agri_order.payment_status = 'refunded'
            instance.payment.agri_order.save()
    
    else:
        print(f"Refund {instance.id} status: {instance.status}")
        
        if instance.status == 'completed':
            instance.completed_at = timezone.now()
            instance.save()

@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    """Handle payment deletion"""
    print(f"Payment {instance.reference_number} deleted")
    # Here you could log the deletion, send notifications, etc.
